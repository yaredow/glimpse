package postgres_test

import (
	"context"
	"testing"
	"time"

	"github.com/pashagolub/pgxmock/v5"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
)

func TestPreferenceRepository_GetByUserID(t *testing.T) {
	t.Run("found", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewPreferenceRepository(&postgres.DB{Pool: mock})

		now := time.Now()
		mock.ExpectQuery("SELECT user_id, favorite_genres, excluded_genres, languages, min_rating, min_year, max_year, created_at, updated_at FROM user_preferences WHERE user_id = \\$1").
			WithArgs(int64(1)).
			WillReturnRows(pgxmock.NewRows([]string{
				"user_id", "favorite_genres", "excluded_genres", "languages",
				"min_rating", "min_year", "max_year", "created_at", "updated_at",
			}).AddRow(int64(1), []int32{28, 12}, []int32{99}, []string{"en"},
				float64(6.0), 1990, 2025, now, now))

		p, err := repo.GetByUserID(context.Background(), 1)
		require.NoError(t, err)
		require.NotNil(t, p)
		require.Equal(t, int64(1), p.UserID)
		require.Equal(t, []int{28, 12}, p.FavoriteGenres)
		require.Equal(t, []int{99}, p.ExcludedGenres)
		require.Equal(t, []string{"en"}, p.Languages)
		require.Equal(t, 6.0, p.MinRating)
		require.Equal(t, 1990, p.MinYear)
		require.Equal(t, 2025, p.MaxYear)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("not found", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewPreferenceRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery("SELECT user_id, favorite_genres, excluded_genres, languages, min_rating, min_year, max_year, created_at, updated_at FROM user_preferences WHERE user_id = \\$1").
			WithArgs(int64(99)).
			WillReturnRows(pgxmock.NewRows([]string{
				"user_id", "favorite_genres", "excluded_genres", "languages",
				"min_rating", "min_year", "max_year", "created_at", "updated_at",
			}))

		p, err := repo.GetByUserID(context.Background(), 99)
		require.NoError(t, err)
		require.Nil(t, p)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestPreferenceRepository_Upsert(t *testing.T) {
	t.Run("insert", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewPreferenceRepository(&postgres.DB{Pool: mock})

		mock.ExpectExec("INSERT INTO user_preferences").
			WithArgs(int64(1), []int32{28}, []int32{}, []string{"en"}, float64(6.0), 1990, 2025).
			WillReturnResult(pgxmock.NewResult("INSERT", 1))

		p := &domain.Preference{
			UserID:         1,
			FavoriteGenres: []int{28},
			ExcludedGenres: []int{},
			Languages:      []string{"en"},
			MinRating:      6.0,
			MinYear:        1990,
			MaxYear:        2025,
		}

		err = repo.Upsert(context.Background(), p)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("update", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewPreferenceRepository(&postgres.DB{Pool: mock})

		mock.ExpectExec("INSERT INTO user_preferences").
			WithArgs(int64(1), []int32{12}, []int32{99}, []string{"en", "fr"}, float64(7.0), 2000, 2024).
			WillReturnResult(pgxmock.NewResult("INSERT", 1))

		p := &domain.Preference{
			UserID:         1,
			FavoriteGenres: []int{12},
			ExcludedGenres: []int{99},
			Languages:      []string{"en", "fr"},
			MinRating:      7.0,
			MinYear:        2000,
			MaxYear:        2024,
		}

		err = repo.Upsert(context.Background(), p)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}
