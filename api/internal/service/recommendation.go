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
	GetCandidateMovies(ctx context.Context, userID int64, limit int, filter *domain.CandidateFilter) ([]*domain.Movie, error)
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
	MarkRevealed(ctx context.Context, userID, movieID int64) error
	IsLockedIn(ctx context.Context, userID int64) (bool, error)
}

type RecGridHistoryRepository interface {
	GetRecent(ctx context.Context, userID int64, limit int) ([]domain.GridHistoryEntry, error)
	Insert(ctx context.Context, userID int64, movieID int64) error
}

type RecInteractionRepository interface {
	Insert(ctx context.Context, interaction *domain.Interaction) error
	GetHistory(ctx context.Context, userID int64, action string) ([]domain.HistoryMovie, error)
}

type RecUserRepository interface {
	GetByID(ctx context.Context, userID int64) (*domain.User, error)
	UpdateInteractionsStat(ctx context.Context, userID int64) error
	DecrementSyncs(ctx context.Context, userID int64) (int, error)
	ResetDailySyncsIfDue(ctx context.Context, userID int64) error
}

type RecGenreRepository interface {
	GetNamesByID(ctx context.Context, ids []int) ([]string, error)
}

type TaskRunner interface {
	Background(fn func())
}

type DetailSyncer func(ctx context.Context, tmdbID int) error

const candidatePoolSize = 1000

type RecommendationService struct {
	movies       RecMovieRepository
	affinities   RecAffinityRepository
	interactions RecInteractionRepository
	grid         RecGridRepository
	gridHistory  RecGridHistoryRepository
	users        RecUserRepository
	genres       RecGenreRepository
	db           *postgres.DB
	syncDetail   DetailSyncer
	runner       TaskRunner
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
	syncDetail DetailSyncer,
	runner TaskRunner,
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
		syncDetail:   syncDetail,
		runner:       runner,
	}
}

// enqueueDetailSync hydrates full movie details without blocking the request.
func (rs *RecommendationService) enqueueDetailSync(movies []ScoredMovie) {
	if rs.syncDetail == nil || rs.runner == nil {
		return
	}

	syncDetail := rs.syncDetail
	for _, sm := range movies {
		tmdbID := sm.Movie.TmdbID
		rs.runner.Background(func() {
			_ = syncDetail(context.Background(), tmdbID)
		})
	}
}

// enqueueMissingTaglineSync fills in taglines for already-generated slots in the background.
func (rs *RecommendationService) enqueueMissingTaglineSync(slots []domain.GridSlotResponse) {
	if rs.syncDetail == nil || rs.runner == nil {
		return
	}

	syncDetail := rs.syncDetail
	for _, slot := range slots {
		if slot.Tagline != nil && *slot.Tagline != "" {
			continue
		}
		tmdbID := slot.TmdbID
		rs.runner.Background(func() {
			_ = syncDetail(context.Background(), tmdbID)
		})
	}
}

func GetMoodFilter(mood string) *domain.CandidateFilter {
	switch mood {
	case "horror", "spooky":
		genre := "Horror"
		return &domain.CandidateFilter{
			RequiredGenre:  &genre,
			ExcludedGenres: []string{"Animation", "Family"},
		}
	case "action_crime", "adrenaline":
		return &domain.CandidateFilter{
			AnyGenres:      []string{"Action", "Crime"},
			ExcludedGenres: []string{"Animation", "Family", "Romance", "Comedy"},
		}
	case "psychological", "mind_bender":
		return &domain.CandidateFilter{
			AnyGenres:        []string{"Mystery"},
			RequireAllGenres: []string{"Science Fiction", "Thriller"},
			ExcludedGenres:   []string{"Animation", "Family", "Comedy", "Action"},
		}
	case "comedy", "feel_good":
		genre := "Comedy"
		return &domain.CandidateFilter{
			RequiredGenre:  &genre,
			ExcludedGenres: []string{"Action", "Adventure", "Science Fiction", "Fantasy", "War"},
		}
	case "classics", "nostalgia":
		start := time.Date(1975, 1, 1, 0, 0, 0, 0, time.UTC)
		end := time.Date(1999, 12, 31, 23, 59, 59, 0, time.UTC)
		return &domain.CandidateFilter{
			MinDate:        &start,
			MaxDate:        &end,
			ExcludedGenres: []string{"Animation", "Family"},
		}
	default:
		return nil
	}
}

func (rs *RecommendationService) GenerateGrid(ctx context.Context, userID int64) ([]domain.GridSlotResponse, uuid.UUID, error) {
	_ = rs.users.ResetDailySyncsIfDue(ctx, userID)

	existing, err := rs.grid.GetByID(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get existing grid: %w", err)
	}

	if len(existing) > 0 {
		if existing[0].GridSessionID == uuid.Nil {
			return nil, uuid.Nil, domain.ErrMissingGridSessionID
		}
		rs.enqueueMissingTaglineSync(existing)
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

	candidates, err := rs.movies.GetCandidateMovies(ctx, userID, candidatePoolSize, nil)
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
		txDB := postgres.NewDBFromTx(tx)

		gtx := postgres.NewGridRepository(txDB)
		if err := gtx.Clear(ctx, userID); err != nil {
			return fmt.Errorf("clear grid: %w", err)
		}

		for i, movieID := range movieIDs {
			if err := gtx.Insert(ctx, userID, movieID, sessionID, i+1); err != nil {
				return fmt.Errorf("insert slot %d: %w", i+1, err)
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

	rs.enqueueDetailSync(picked)

	return grid, sessionID, nil
}

func (rs *RecommendationService) SyncGrid(ctx context.Context, userID int64, mood string) ([]domain.GridSlotResponse, int, error) {
	_ = rs.users.ResetDailySyncsIfDue(ctx, userID)

	user, err := rs.users.GetByID(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("get user: %w", err)
	}

	if user.SyncsRemaining <= 0 {
		return nil, 0, domain.ErrNoSyncsRemaining
	}

	locked, err := rs.grid.IsLockedIn(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("check locked status: %w", err)
	}
	if locked {
		return nil, 0, domain.ErrSelectionLocked
	}

	affinityPtrs, err := rs.affinities.GetByUserID(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("get affinities: %w", err)
	}

	affinities := make([]domain.Affinity, len(affinityPtrs))
	for i, a := range affinityPtrs {
		affinities[i] = *a
	}

	filter := GetMoodFilter(mood)
	candidates, err := rs.movies.GetCandidateMovies(ctx, userID, candidatePoolSize, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("get candidates: %w", err)
	}

	recentEntries, err := rs.gridHistory.GetRecent(ctx, userID, 50)
	if err != nil {
		return nil, 0, fmt.Errorf("get recently shown: %w", err)
	}

	recentlyShown := make(map[int64]time.Time, len(recentEntries))
	for _, e := range recentEntries {
		recentlyShown[e.MovieID] = e.ShownAt
	}

	scored := ScoreMovies(candidates, affinities, recentlyShown, user.TotalInteractions)
	if len(scored) < 5 {
		return nil, 0, domain.ErrNotEnoughCandidates
	}

	picked := enforceDiversity(scored)
	sessionID := uuid.New()

	movieIDs := make([]int64, len(picked))
	for i, sm := range picked {
		movieIDs[i] = sm.Movie.ID
	}

	var remainingSyncs int

	if err := rs.db.ExecTx(ctx, func(tx pgx.Tx) error {
		txDB := postgres.NewDBFromTx(tx)

		gtx := postgres.NewGridRepository(txDB)
		if err := gtx.Clear(ctx, userID); err != nil {
			return fmt.Errorf("clear grid: %w", err)
		}

		for i, movieID := range movieIDs {
			if err := gtx.Insert(ctx, userID, movieID, sessionID, i+1); err != nil {
				return fmt.Errorf("insert slot %d: %w", i+1, err)
			}
		}

		utx := postgres.NewUserRepository(txDB)
		rem, err := utx.DecrementSyncs(ctx, userID)
		if err != nil {
			return fmt.Errorf("decrement syncs: %w", err)
		}
		remainingSyncs = rem

		return nil
	}); err != nil {
		return nil, 0, fmt.Errorf("sync grid transaction: %w", err)
	}

	grid, err := rs.grid.GetByID(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("get new grid: %w", err)
	}

	rs.enqueueDetailSync(picked)

	return grid, remainingSyncs, nil
}

func (rs *RecommendationService) RecordInteraction(ctx context.Context, userID, movieID int64, action string, sessionID uuid.UUID, gridPosition, revealActionMs, rating *int) error {
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
		txDB := postgres.NewDBFromTx(tx)

		atx := postgres.NewAffinityRepository(txDB)
		if weight.Delta != 0 {
			for _, dim := range dims {
				if err := atx.Upsert(ctx, userID, dim.Name, dim.Value, weight.Delta); err != nil {
					return fmt.Errorf("upsert affinity: %w", err)
				}
			}
		}

		itx := postgres.NewInteractionRepository(txDB)
		if err := itx.Insert(ctx, &domain.Interaction{
			UserID:           userID,
			MovieID:          movieID,
			Action:           domain.ActionType(action),
			GridSessionID:    sessionID,
			GridPosition:     gridPosition,
			RevealToActionMS: revealActionMs,
			Rating:           rating,
		}); err != nil {
			return fmt.Errorf("insert interaction: %w", err)
		}

		ghtx := postgres.NewGridHistoryRepository(txDB)
		if err := ghtx.Insert(ctx, userID, movieID); err != nil {
			return fmt.Errorf("insert grid history: %w", err)
		}

		gtx := postgres.NewGridRepository(txDB)
		if err := gtx.MarkRevealed(ctx, userID, movieID); err != nil {
			return fmt.Errorf("mark slot revealed: %w", err)
		}

		if weight.AffectExploration {
			utx := postgres.NewUserRepository(txDB)
			if err := utx.UpdateInteractionsStat(ctx, userID); err != nil {
				return fmt.Errorf("update interaction stats: %w", err)
			}
		}

		mtx := postgres.NewMovieRepository(txDB)
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

func (rs *RecommendationService) GetHistory(ctx context.Context, userID int64, action string) ([]domain.HistoryMovie, error) {
	return rs.interactions.GetHistory(ctx, userID, action)
}
