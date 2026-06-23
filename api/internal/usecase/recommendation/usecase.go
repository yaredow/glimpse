package recusecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yaredow/glimpse-api/internal/entity"
)

type Usecase struct {
	movies         MovieRepository
	affinities     AffinityRepository
	interactions   InteractionRepository
	grid           GridRepository
	gridHistory    GridHistoryRepository
	users          UserRepository
	genres         GenreRepository
	preferences    PreferenceRepository
	txManager      TransactionManager
}

func New(
	movies MovieRepository,
	affinities AffinityRepository,
	interactions InteractionRepository,
	grid GridRepository,
	gridHistory GridHistoryRepository,
	users UserRepository,
	genres GenreRepository,
	preferences PreferenceRepository,
	txManager TransactionManager,
) *Usecase {
	return &Usecase{
		movies:       movies,
		affinities:   affinities,
		interactions: interactions,
		grid:         grid,
		gridHistory:  gridHistory,
		users:        users,
		genres:       genres,
		preferences:  preferences,
		txManager:    txManager,
	}
}

func (uc *Usecase) GenerateGrid(ctx context.Context, userID int64) ([]GridSlot, uuid.UUID, error) {
	existing, err := uc.grid.GetUserGrid(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get existing grid: %w", err)
	}

	if len(existing) > 0 {
		if existing[0].GridSessionID == uuid.Nil {
			return nil, uuid.Nil, ErrMissingGridSessionID
		}
		return existing, existing[0].GridSessionID, nil
	}

	affinities, err := uc.affinities.GetByUser(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get affinities: %w", err)
	}

	candidates, err := uc.movies.GetCandidateMovies(ctx, userID, 200)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get candidates: %w", err)
	}

	recentlyShown, err := uc.gridHistory.GetRecentlyShown(ctx, userID, 50)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get recently shown: %w", err)
	}

	fresh := make(map[int64]time.Time, len(recentlyShown))
	for _, rs := range recentlyShown {
		fresh[rs.MovieID] = rs.ShownAt
	}

	user, err := uc.users.GetByID(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get user: %w", err)
	}

	scored := ScoreMovies(candidates, affinities, fresh, int(user.TotalInteractions))
	if len(scored) < 5 {
		return nil, uuid.Nil, ErrNotEnoughCandidates
	}

	picked := enforceDiversity(scored)

	sessionID := uuid.New()

	movieIDs := make([]int64, len(picked))
	for i, sm := range picked {
		movieIDs[i] = sm.Movie.ID
	}

	if err := uc.txManager.RunInTx(ctx, func(rp RepositoryProvider) error {
		if err := rp.Grid().Clear(ctx, userID); err != nil {
			return fmt.Errorf("clear grid: %w", err)
		}

		for i, movieID := range movieIDs {
			if err := rp.Grid().InsertSlot(ctx, userID, movieID, int32(i+1), sessionID); err != nil {
				return fmt.Errorf("insert slot: %w", err)
			}
		}

		for _, movieID := range movieIDs {
			if err := rp.GridHistory().Insert(ctx, userID, movieID); err != nil {
				return fmt.Errorf("insert grid history: %w", err)
			}
		}

		return nil
	}); err != nil {
		return nil, uuid.Nil, fmt.Errorf("generate grid transaction: %w", err)
	}

	grid, err := uc.grid.GetUserGrid(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, fmt.Errorf("get new grid: %w", err)
	}

	return grid, sessionID, nil
}

func (uc *Usecase) RecordInteraction(ctx context.Context, userID, movieID int64, action string, sessionID uuid.UUID, gridPosition *int, revealActionMs *int) error {
	weight, ok := getActionWeight(action)
	if !ok {
		return ErrInvalidAction
	}

	movie, err := uc.movies.GetByID(ctx, movieID)
	if err != nil {
		return fmt.Errorf("get movie: %w", err)
	}

	year := int32(0)
	if !movie.ReleaseDate.IsZero() {
		year = int32(movie.ReleaseDate.Year())
	}

	dims := MovieDimensions(movie.Genres, movie.OriginalLanguage, year, movie.VoteAverage)

	return uc.txManager.RunInTx(ctx, func(rp RepositoryProvider) error {
		for _, dim := range dims {
			if err := rp.Affinity().Upsert(ctx, userID, dim.Name, dim.Value, weight.Delta); err != nil {
				return fmt.Errorf("upsert affinity: %w", err)
			}
		}

		if err := rp.Interaction().Insert(ctx, &entity.Interaction{
			UserID:           userID,
			MovieID:          movieID,
			Action:           entity.ActionType(action),
			GridSessionID:    sessionID.String(),
			GridPosition:     gridPosition,
			RevealToActionMs: revealActionMs,
		}); err != nil {
			return fmt.Errorf("insert interaction: %w", err)
		}

		if weight.AffectExploration {
			if err := rp.User().UpdateInteractionStats(ctx, userID); err != nil {
				return fmt.Errorf("update interaction stats: %w", err)
			}
		}

		if err := rp.Movie().UpdateWatchCounts(ctx, movieID, action == "revealed" || action == "watched", action == "watched"); err != nil {
			return fmt.Errorf("update watch counts: %w", err)
		}

		return nil
	})
}

func (uc *Usecase) GetPreferences(ctx context.Context, userID int64) (*entity.Preference, error) {
	return uc.preferences.GetByUser(ctx, userID)
}

func (uc *Usecase) UpsertPreferences(ctx context.Context, userID int64, input UpsertPreferenceInput, onboarded bool) (*entity.Preference, error) {
	return uc.preferences.Upsert(ctx, userID, input, onboarded)
}

func (uc *Usecase) UpdatePreferences(ctx context.Context, userID int64, input UpsertPreferenceInput) (*entity.Preference, error) {
	return uc.preferences.Update(ctx, userID, input)
}

func (uc *Usecase) ListGenres(ctx context.Context) ([]*entity.Genre, error) {
	return uc.genres.List(ctx)
}

func (uc *Usecase) SeedFromOnboarding(ctx context.Context, userID int64, genreIDs []int32) error {
	names, err := uc.genres.GetNamesByIDs(ctx, genreIDs)
	if err != nil {
		return fmt.Errorf("get genre names: %w", err)
	}

	for _, name := range names {
		if err := uc.affinities.Upsert(ctx, userID, "genre", name, 1); err != nil {
			return fmt.Errorf("seed affinity: %w", err)
		}
	}

	return nil
}
