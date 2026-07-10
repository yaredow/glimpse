package postgres_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/pashagolub/pgxmock/v5"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
)

func TestGridRepository_Clear(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGridRepository(&postgres.DB{Pool: mock})

		mock.ExpectExec(`DELETE FROM daily_pools WHERE user_id = \$1`).
			WithArgs(int64(1)).
			WillReturnResult(pgxmock.NewResult("DELETE", 5))

		err = repo.Clear(context.Background(), 1)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("no rows", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGridRepository(&postgres.DB{Pool: mock})

		mock.ExpectExec(`DELETE FROM daily_pools WHERE user_id = \$1`).
			WithArgs(int64(1)).
			WillReturnResult(pgxmock.NewResult("DELETE", 0))

		err = repo.Clear(context.Background(), 1)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestGridRepository_Insert(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGridRepository(&postgres.DB{Pool: mock})

		sessionID := uuid.New()
		mock.ExpectExec(`INSERT INTO daily_pools \(user_id, movie_id, slot_number, grid_session_id\) VALUES \(\$1, \$2, \$3, \$4\)`).
			WithArgs(int64(1), int64(10), 3, sessionID).
			WillReturnResult(pgxmock.NewResult("INSERT", 1))

		err = repo.Insert(context.Background(), 1, 10, sessionID, 3)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestGridRepository_GetByID(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGridRepository(&postgres.DB{Pool: mock})

		sessionID := uuid.New()
		rows := pgxmock.NewRows([]string{
			"id", "tmdb_id", "slot_number", "is_revealed", "vague_description", "genres", "grid_session_id",
		}).AddRow(int64(10), 550, 1, false, "A mysterious journey", []string{"Drama", "Action"}, sessionID)

		mock.ExpectQuery(`SELECT.*FROM daily_pools d JOIN movies m ON m.id = d.movie_id WHERE d.user_id = \$1 ORDER BY d.slot_number`).
			WithArgs(int64(1)).
			WillReturnRows(rows)

		slots, err := repo.GetByID(context.Background(), 1)
		require.NoError(t, err)
		require.Len(t, slots, 1)
		require.Equal(t, int64(10), slots[0].MovieID)
		require.Equal(t, 550, slots[0].TmdbID)
		require.Equal(t, 1, slots[0].SlotNumber)
		require.False(t, slots[0].IsRevealed)
		require.Equal(t, "A mysterious journey", slots[0].VagueDescription)
		require.Equal(t, []string{"Drama", "Action"}, slots[0].Genres)
		require.Equal(t, sessionID, slots[0].GridSessionID)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("no rows", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewGridRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery(`SELECT.*FROM daily_pools d JOIN movies m ON m.id = d.movie_id WHERE d.user_id = \$1 ORDER BY d.slot_number`).
			WithArgs(int64(1)).
			WillReturnRows(pgxmock.NewRows([]string{
				"id", "tmdb_id", "slot_number", "is_revealed", "vague_description", "genres", "grid_session_id",
			}))

		slots, err := repo.GetByID(context.Background(), 1)
		require.NoError(t, err)
		require.Empty(t, slots)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}
