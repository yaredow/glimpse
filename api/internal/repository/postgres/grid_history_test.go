package postgres_test

import (
	"context"
	"testing"
	"time"

	"github.com/pashagolub/pgxmock/v5"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
)

func TestGridHistoryRepository_Insert(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGridHistoryRepository(&postgres.DB{Pool: mock})

		mock.ExpectExec(`INSERT INTO user_grid_history \(user_id, movie_id\) VALUES \(\$1, \$2\)`).
			WithArgs(int64(1), int64(10)).
			WillReturnResult(pgxmock.NewResult("INSERT", 1))

		err = repo.Insert(context.Background(), 1, 10)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestGridHistoryRepository_CleanupOld(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGridHistoryRepository(&postgres.DB{Pool: mock})

		mock.ExpectExec(`DELETE FROM user_grid_history WHERE shown_at < NOW\(\) - INTERVAL '30 days'`).
			WillReturnResult(pgxmock.NewResult("DELETE", 10))

		err = repo.CleanupOld(context.Background())
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestGridHistoryRepository_GetRecent(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGridHistoryRepository(&postgres.DB{Pool: mock})

		now := time.Now()
		rows := pgxmock.NewRows([]string{"movie_id", "shown_at"}).
			AddRow(int64(10), now).
			AddRow(int64(20), now.Add(-time.Hour))

		mock.ExpectQuery(`SELECT movie_id, shown_at FROM user_grid_history WHERE user_id = \$1 ORDER BY shown_at DESC LIMIT \$2`).
			WithArgs(int64(1), 50).
			WillReturnRows(rows)

		entries, err := repo.GetRecent(context.Background(), 1, 50)
		require.NoError(t, err)
		require.Len(t, entries, 2)
		require.Equal(t, int64(10), entries[0].MovieID)
		require.Equal(t, int64(20), entries[1].MovieID)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("no rows", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGridHistoryRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery(`SELECT movie_id, shown_at FROM user_grid_history WHERE user_id = \$1 ORDER BY shown_at DESC LIMIT \$2`).
			WithArgs(int64(1), 50).
			WillReturnRows(pgxmock.NewRows([]string{"movie_id", "shown_at"}))

		entries, err := repo.GetRecent(context.Background(), 1, 50)
		require.NoError(t, err)
		require.Empty(t, entries)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}
