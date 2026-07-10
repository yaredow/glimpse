package postgres_test

import (
	"context"
	"testing"

	"github.com/pashagolub/pgxmock/v5"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
)

func TestGenreRepository_List(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGenreRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery("SELECT id, name FROM genres ORDER BY name").
			WillReturnRows(pgxmock.NewRows([]string{"id", "name"}).
				AddRow(28, "Action").
				AddRow(12, "Adventure").
				AddRow(35, "Comedy"))

		genres, err := repo.List(context.Background())
		require.NoError(t, err)
		require.Len(t, genres, 3)
		require.Equal(t, "Action", genres[0].Name)
		require.Equal(t, 28, genres[0].ID)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("no rows", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGenreRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery("SELECT id, name FROM genres ORDER BY name").
			WillReturnRows(pgxmock.NewRows([]string{"id", "name"}))

		genres, err := repo.List(context.Background())
		require.NoError(t, err)
		require.Empty(t, genres)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestGenreRepository_GetNamesByID(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGenreRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery("SELECT name FROM genres WHERE id = ANY\\(\\$1\\) ORDER BY name").
			WithArgs([]int{28, 12}).
			WillReturnRows(pgxmock.NewRows([]string{"name"}).
				AddRow("Action").
				AddRow("Adventure"))

		names, err := repo.GetNamesByID(context.Background(), []int{28, 12})
		require.NoError(t, err)
		require.Len(t, names, 2)
		require.Equal(t, "Action", names[0])
		require.Equal(t, "Adventure", names[1])
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("no rows", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGenreRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery("SELECT name FROM genres WHERE id = ANY\\(\\$1\\) ORDER BY name").
			WithArgs([]int{999}).
			WillReturnRows(pgxmock.NewRows([]string{"name"}))

		names, err := repo.GetNamesByID(context.Background(), []int{999})
		require.NoError(t, err)
		require.Empty(t, names)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}
