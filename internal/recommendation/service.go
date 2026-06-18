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
		return existing, uuid.Nil, nil
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
		fresh[rs.MovieID] = rs.ShownAt.Time
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

	pgUserID := pgtype.Int8{Int64: userID, Valid: true}
	err = s.store.ExecTx(ctx, func(q *queries.Queries) error {
		if err := q.ClearUserGrid(ctx, pgUserID); err != nil {
			return err
		}

		for i, movieID := range movieIDs {
			params := queries.InsertGridSlotParams{
				UserID:     pgUserID,
				MovieID:    pgtype.Int8{Int64: movieID, Valid: true},
				SlotNumber: int32(i + 1),
			}
			if err := q.InsertGridSlot(ctx, params); err != nil {
				return err
			}
		}

		for _, movieID := range movieIDs {
			params := queries.InsertGridHistoryParams{
				UserID:  userID,
				MovieID: movieID,
			}
			if err := q.InsertGridHistory(ctx, params); err != nil {
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
