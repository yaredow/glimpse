package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
)

type RecMovieRepository interface {
	GetByID(ctx context.Context, movieID int64) (*domain.Movie, error)
	GetCandidateMovies(ctx context.Context, userID int64, limit int) ([]*domain.Movie, error)
	UpdateWatchCount(ctx context.Context, movieID int64, shown, watched bool) error
}

type RecAffinityRepository interface {
	GetByUserID(ctx context.Context, userID int64) ([]*domain.Affinity, error)
	Upsert(ctx context.Context, userID int64, dimension, value string, delta float64) error
}

type RecGridRepository interface {
	GetByID(ctx context.Context, userID int64) ([]domain.GridSlotResponse, error)
	Clear(ctx context.Context, userID int64) error
	Insert(ctx context.Context, userID int64, movieID int64, sessionID uuid.UUID, slotNumber int) error
}

type RecGridHistoryRepository interface {
	GetRecent(ctx context.Context, userID int64, limit int) ([]domain.GridHistoryEntry, error)
	Insert(ctx context.Context, userID int64, movieID int64) error
}

type RecInteractionRepository interface {
	Insert(ctx context.Context, interaction *domain.Interaction) error
}

type RecUserRepository interface {
	GetByID(ctx context.Context, userID int64) (*domain.User, error)
	UpdateInteractionsStat(ctx context.Context, userID int64) error
}

type RecGenreRepository interface {
	GetNamesByID(ctx context.Context, ids []int) ([]string, error)
}

type RecommendationService struct {
	movies       RecMovieRepository
	affinities   RecAffinityRepository
	interactions RecInteractionRepository
	grid         RecGridRepository
	gridHistory  RecGridHistoryRepository
	users        RecUserRepository
	genres       RecGenreRepository
	db           *postgres.DB
}

func NewRecommendationService(
	movies RecMovieRepository,
	affinities RecAffinityRepository,
	interactions RecInteractionRepository,
	grid RecGridRepository,
	gridHistory RecGridHistoryRepository,
	users RecUserRepository,
	genres RecGenreRepository,
	db *postgres.DB,
) *RecommendationService {
	return &RecommendationService{
		movies:       movies,
		affinities:   affinities,
		interactions: interactions,
		grid:         grid,
		gridHistory:  gridHistory,
		users:        users,
		genres:       genres,
		db:           db,
	}
}

func (rs *RecommendationService) GenerateGrid(ctx context.Context, userID int64) ([]domain.GridSlotResponse, uuid.UUID, error) {
	existing, err := rs.grid.GetByID(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get existing grid: %w", err)
	}

	if len(existing) > 0 {
		if existing[0].GridSessionID == uuid.Nil {
			return nil, uuid.Nil, domain.ErrMissingGridSessionID
		}
		return existing, existing[0].GridSessionID, nil
	}

	affinityPtrs, err := rs.affinities.GetByUserID(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get affinities: %w", err)
	}

	affinities := make([]domain.Affinity, len(affinityPtrs))
	for i, a := range affinityPtrs {
		affinities[i] = *a
	}

	candidates, err := rs.movies.GetCandidateMovies(ctx, userID, 200)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get candidates: %w", err)
	}

	recentEntries, err := rs.gridHistory.GetRecent(ctx, userID, 50)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get recently shown: %w", err)
	}

	recentlyShown := make(map[int64]time.Time, len(recentEntries))
	for _, e := range recentEntries {
		recentlyShown[e.MovieID] = e.ShownAt
	}

	user, err := rs.users.GetByID(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get user: %w", err)
	}

	scored := ScoreMovies(candidates, affinities, recentlyShown, user.TotalInteractions)
	if len(scored) < 5 {
		return nil, uuid.Nil, domain.ErrNotEnoughCandidates
	}

	picked := enforceDiversity(scored)

	sessionID := uuid.New()

	movieIDs := make([]int64, len(picked))
	for i, sm := range picked {
		movieIDs[i] = sm.Movie.ID
	}

	if err := rs.db.ExecTx(ctx, func(tx pgx.Tx) error {
		gtx := rs.grid.(*postgres.GridRepository).WithTx(tx)
		if err := gtx.Clear(ctx, userID); err != nil {
			return fmt.Errorf("clear grid: %w", err)
		}

		for i, movieID := range movieIDs {
			if err := gtx.Insert(ctx, userID, movieID, sessionID, i+1); err != nil {
				return fmt.Errorf("insert slot %d: %w", i+1, err)
			}
		}

		ghtx := rs.gridHistory.(*postgres.GridHistoryRepository).WithTx(tx)
		for _, movieID := range movieIDs {
			if err := ghtx.Insert(ctx, userID, movieID); err != nil {
				return fmt.Errorf("insert grid history: %w", err)
			}
		}

		return nil
	}); err != nil {
		return nil, uuid.Nil, fmt.Errorf("generate grid transaction: %w", err)
	}

	grid, err := rs.grid.GetByID(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get new grid: %w", err)
	}

	return grid, sessionID, nil
}

func (rs *RecommendationService) RecordInteraction(ctx context.Context, userID, movieID int64, action string, sessionID uuid.UUID, gridPosition, revealActionMs *int) error {
	weight, ok := getActionWeight(action)
	if !ok {
		return domain.ErrInvalidAction
	}

	movie, err := rs.movies.GetByID(ctx, movieID)
	if err != nil {
		return fmt.Errorf("get movie: %w", err)
	}

	year := int32(0)
	if !movie.ReleaseDate.IsZero() {
		year = int32(movie.ReleaseDate.Year())
	}

	dims := MovieDimensions(movie.Genres, movie.OriginalLanguage, year, movie.VoteAverage)

	return rs.db.ExecTx(ctx, func(tx pgx.Tx) error {
		atx := rs.affinities.(*postgres.AffinityRepository).WithTx(tx)
		for _, dim := range dims {
			if err := atx.Upsert(ctx, userID, dim.Name, dim.Values, weight.Delta); err != nil {
				return fmt.Errorf("upsert affinity: %w", err)
			}
		}

		itx := rs.interactions.(*postgres.InteractionRepository).WithTx(tx)
		if err := itx.Insert(ctx, &domain.Interaction{
			UserID:           userID,
			MovieID:          movieID,
			Action:           domain.ActionType(action),
			GridSessionID:    sessionID,
			GridPosition:     gridPosition,
			RevealToActionMS: revealActionMs,
		}); err != nil {
			return fmt.Errorf("insert interaction: %w", err)
		}

		if weight.AffectExploration {
			utx := rs.users.(*postgres.UserRespository).WithTx(tx)
			if err := utx.UpdateInteractionsStat(ctx, userID); err != nil {
				return fmt.Errorf("update interaction stats: %w", err)
			}
		}

		mtx := rs.movies.(*postgres.MovieRepository).WithTx(tx)
		shown := action == "revealed" || action == "watched"
		watched := action == "watched"
		if err := mtx.UpdateWatchCount(ctx, movieID, shown, watched); err != nil {
			return fmt.Errorf("update watch counts: %w", err)
		}

		return nil
	})
}

func (rs *RecommendationService) SeedFromOnboarding(ctx context.Context, userID int64, genreIDs []int) error {
	names, err := rs.genres.GetNamesByID(ctx, genreIDs)
	if err != nil {
		return fmt.Errorf("get genre names: %w", err)
	}

	for _, name := range names {
		if err := rs.affinities.Upsert(ctx, userID, "genre", name, 1.0); err != nil {
			return fmt.Errorf("seed affinity: %w", err)
		}
	}

	return nil
}
