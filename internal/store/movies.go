package store

import (
	"context"
	"fmt"
	"strconv"

	"github.com/jackc/pgx/v5/pgtype"
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
	var minRating pgtype.Numeric
	if err := minRating.Scan(strconv.FormatFloat(input.MinRating, 'f', 1, 64)); err != nil {
		return nil, fmt.Errorf("parse min_rating: %w", err)
	}

	params := queries.GetFilteredMoviesParams{
		FavoriteGenres: tmdb.GenreNames(toIntSlice(input.FavoriteGenres)),
		ExcludedGenres: tmdb.GenreNames(toIntSlice(input.ExcludedGenres)),
		Languages:      input.Languages,
		MinRating:      minRating,
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
	rows, err := s.Queries.GetUserGrid(ctx, pgtype.Int8{Int64: userID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("get user grid: %w", err)
	}

	return rows, nil
}

func (s *Store) CreateUserGrid(ctx context.Context, userID int64, movieIDs []int64) error {
	return s.ExecTx(ctx, func(q *queries.Queries) error {
		_ = q.ClearUserGrid(ctx, pgtype.Int8{Int64: userID, Valid: true})

		for i, movieID := range movieIDs {
			err := q.InsertGridSlot(ctx, queries.InsertGridSlotParams{
				UserID:     pgtype.Int8{Int64: userID, Valid: true},
				MovieID:    pgtype.Int8{Int64: movieID, Valid: true},
				SlotNumber: int32(i + 1),
			})
			if err != nil {
				return fmt.Errorf("insert slot %d: %w", i+1, err)
			}
		}

		return nil
	})
}

func numericToFloat64(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}

	f, err := strconv.ParseFloat(n.Int.String()+"e"+strconv.Itoa(int(n.Exp)), 64)
	if err != nil {
		return 0
	}

	return f
}

func (s *Store) GetFilteredMoviesFromPrefs(ctx context.Context, userID int64, prefs queries.UserPreference, limit int32) ([]queries.Movie, error) {
	return s.GetFilteredMovies(ctx, userID, FilterInput{
		FavoriteGenres: prefs.FavoriteGenres,
		ExcludedGenres: prefs.ExcludedGenres,
		Languages:      prefs.Languages,
		MinRating:      numericToFloat64(prefs.MinRating),
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
