package store

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	"github.com/yaredow/glimpse-api/internal/tmdb"
)

type FilterInput struct {
	FavoriteGenres []int32
	ExcludedGenres []int32
	Languages      []string
	MinRating      float64
	MinYear        int32
	MaxYear        int32
}

func (s *Store) GetFilteredMovies(ctx context.Context, userID int64, input FilterInput, limit int32) ([]queries.Movie, error) {
	params := queries.GetFilteredMoviesParams{
		FavoriteGenres: tmdb.GenreNames(toIntSlice(input.FavoriteGenres)),
		ExcludedGenres: tmdb.GenreNames(toIntSlice(input.ExcludedGenres)),
		Languages:      input.Languages,
		MinRating:      input.MinRating,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
		UserID:         userID,
		Limit:          limit,
	}

	movies, err := s.Queries.GetFilteredMovies(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("get filtered movies: %w", err)
	}

	return movies, nil
}

func (s *Store) GetUserGrid(ctx context.Context, userID int64) ([]queries.GetUserGridRow, error) {
	rows, err := s.Queries.GetUserGrid(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user grid: %w", err)
	}

	return rows, nil
}

func (s *Store) CreateUserGrid(ctx context.Context, userID int64, movieIDs []int64) error {
	return s.ExecTx(ctx, func(q *queries.Queries) error {
		if err := q.ClearUserGrid(ctx, userID); err != nil {
			return err
		}

		gridSessionID := uuid.New()

		for i, movieID := range movieIDs {
			err := q.InsertGridSlot(ctx, queries.InsertGridSlotParams{
				UserID:        userID,
				MovieID:       movieID,
				SlotNumber:    int32(i + 1),
				GridSessionID: gridSessionID,
			})
			if err != nil {
				return fmt.Errorf("insert slot %d: %w", i+1, err)
			}
		}

		return nil
	})
}

func (s *Store) GetFilteredMoviesFromPrefs(ctx context.Context, userID int64, prefs queries.UserPreference, limit int32) ([]queries.Movie, error) {
	return s.GetFilteredMovies(ctx, userID, FilterInput{
		FavoriteGenres: prefs.FavoriteGenres,
		ExcludedGenres: prefs.ExcludedGenres,
		Languages:      prefs.Languages,
		MinRating:      prefs.MinRating,
		MinYear:        prefs.MinYear,
		MaxYear:        prefs.MaxYear,
	}, limit)
}

func toIntSlice(ids []int32) []int {
	result := make([]int, len(ids))
	for i, id := range ids {
		result[i] = int(id)
	}
	return result
}
