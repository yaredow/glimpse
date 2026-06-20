// Package recommendation provides the logic for generating recommendations
package recommendation

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/store"
	"github.com/yaredow/glimpse-api/internal/store/queries"
)

type Service struct {
	store      *store.Store
	genreNames func([]int) []string
}

func NewService(store *store.Store, genresName func([]int) []string) *Service {
	return &Service{
		store:      store,
		genreNames: genresName,
	}
}

func (s *Service) GenerateGrid(ctx context.Context, userID int64) ([]queries.GetUserGridRow, uuid.UUID, error) {
	existing, err := s.store.GetUserGrid(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, err
	}

	if len(existing) > 0 {
		if existing[0].GridSessionID == uuid.Nil {
			return nil, uuid.Nil, fmt.Errorf("existing grid is missing grid_session_id")
		}

		return existing, existing[0].GridSessionID, nil
	}

	// fetch data for scoring
	affinities, err := s.store.GetUserAffinities(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, err
	}

	candidatesMoviesParams := queries.GetCandidateMoviesParams{
		UserID: userID,
		Limit:  200,
	}
	candidates, err := s.store.GetCandidateMovies(ctx, candidatesMoviesParams)
	if err != nil {
		return nil, uuid.Nil, err
	}

	recentlyShownMoviesParams := queries.GetRecentlyShownMoviesParams{
		UserID: userID,
		Limit:  50,
	}
	recentlyShown, err := s.store.GetRecentlyShownMovies(ctx, recentlyShownMoviesParams)
	if err != nil {
		return nil, uuid.Nil, err
	}

	// build freshness map
	fresh := make(map[int64]time.Time, len(recentlyShown))
	for _, rs := range recentlyShown {
		fresh[rs.MovieID] = rs.ShownAt
	}

	// get users total_interactions
	user, err := s.store.GetUserById(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, err
	}

	// score candidates
	scored := ScoreMovies(candidates, affinities, fresh, int(user.TotalInteractions))
	if len(scored) < 5 {
		return nil, uuid.Nil, fmt.Errorf("not enough movies matching preferences")
	}

	// diversity enhancement
	picked := enforceDiversity(scored)

	sessionID := uuid.New()

	movieIDs := make([]int64, len(picked))
	for i, sm := range picked {
		movieIDs[i] = sm.Movie.ID
	}

	err = s.store.ExecTx(ctx, func(q *queries.Queries) error {
		if err = q.ClearUserGrid(ctx, userID); err != nil {
			return err
		}

		for i, movieID := range movieIDs {
			params := queries.InsertGridSlotParams{
				UserID:        userID,
				MovieID:       movieID,
				SlotNumber:    int32(i + 1),
				GridSessionID: sessionID,
			}
			if err = q.InsertGridSlot(ctx, params); err != nil {
				return err
			}
		}

		for _, movieID := range movieIDs {
			params := queries.InsertGridHistoryParams{
				UserID:  userID,
				MovieID: movieID,
			}
			if err = q.InsertGridHistory(ctx, params); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, uuid.Nil, err
	}

	grid, err := s.store.GetUserGrid(ctx, userID)
	if err != nil {
		return nil, uuid.Nil, err
	}

	return grid, sessionID, nil
}

func (s *Service) RecordInteraction(ctx context.Context, userID int64, movieID int64, action string, sessionID uuid.UUID, gridPosition *int, revealActionMs *int) error {
	movie, err := s.store.GetMovieByID(ctx, movieID)
	if err != nil {
		return err
	}

	weight, ok := getActionWeight(action)

	if !ok {
		return fmt.Errorf("unknown action: %s", action)
	}

	year := int32(0)
	if !movie.ReleaseDate.IsZero() {
		year = int32(movie.ReleaseDate.Year())
	}

	dims := MovieDimensions(movie.Genres, movie.OriginalLanguage, year, movie.VoteAverage)

	var pgGridPos pgtype.Int4
	if gridPosition != nil {
		pgGridPos = pgtype.Int4{Int32: int32(*gridPosition), Valid: true}
	}

	var pgRevealMs pgtype.Int4
	if revealActionMs != nil {
		pgRevealMs = pgtype.Int4{Int32: int32(*revealActionMs), Valid: true}
	}

	return s.store.ExecTx(ctx, func(q *queries.Queries) error {
		for _, dim := range dims {
			if err := q.UpsertUserAffinity(ctx, queries.UpsertUserAffinityParams{
				UserID:    userID,
				Dimension: dim.Name,
				Value:     dim.Value,
				Score:     weight.Delta,
			}); err != nil {
				return err
			}
		}

		if err := q.InsertInteraction(ctx, queries.InsertInteractionParams{
			UserID:           userID,
			MovieID:          movieID,
			Action:           queries.ActionType(action),
			GridSessionID:    sessionID,
			GridPosition:     pgGridPos,
			RevealToActionMs: pgRevealMs,
		}); err != nil {
			return err
		}

		if weight.AffectExploration {
			if err := q.UpdateUserInteractionStats(ctx, userID); err != nil {
				return err
			}
		}

		return q.UpdateMovieWatchCounts(ctx, queries.UpdateMovieWatchCountsParams{
			ID:      movieID,
			Shown:   action == "revealed" || action == "watched",
			Watched: action == "watched",
		})
	})
}

func (s *Service) SeedFromOnboarding(ctx context.Context, userID int64, genreIDs []int) error {
	names := s.genreNames(genreIDs)

	for _, name := range names {
		err := s.store.UpsertUserAffinity(ctx, queries.UpsertUserAffinityParams{
			UserID:    userID,
			Dimension: "genre",
			Value:     name,
			Score:     1,
		})
		if err != nil {
			return err
		}
	}

	return nil
}
