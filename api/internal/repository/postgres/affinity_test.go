package postgres_test

import (
	"context"
	"testing"
	"time"

	"github.com/pashagolub/pgxmock/v5"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
)

func TestAffinityRepository_GetByUserID(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewAffinityRepository(&postgres.DB{Pool: mock})

		now := time.Now()
		rows := pgxmock.NewRows([]string{"user_id", "dimension", "value", "score", "confidence", "last_updated"}).
			AddRow(int64(1), "genre", "Action", 2.5, 3.0, now).
			AddRow(int64(1), "genre", "Comedy", 1.0, 2.0, now.Add(-time.Hour))

		mock.ExpectQuery(`SELECT user_id, dimension, value, score, confidence, last_updated FROM user_affinities WHERE user_id = \$1`).
			WithArgs(int64(1)).
			WillReturnRows(rows)

		affinities, err := repo.GetByUserID(context.Background(), 1)
		require.NoError(t, err)
		require.Len(t, affinities, 2)
		require.Equal(t, "genre", affinities[0].Dimension)
		require.Equal(t, "Action", affinities[0].Value)
		require.Equal(t, 2.5, affinities[0].Score)
		require.Equal(t, 3.0, affinities[0].Confidence)
		require.Equal(t, "genre", affinities[1].Dimension)
		require.Equal(t, "Comedy", affinities[1].Value)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("no rows", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewAffinityRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery(`SELECT user_id, dimension, value, score, confidence, last_updated FROM user_affinities WHERE user_id = \$1`).
			WithArgs(int64(1)).
			WillReturnRows(pgxmock.NewRows([]string{"user_id", "dimension", "value", "score", "confidence", "last_updated"}))

		affinities, err := repo.GetByUserID(context.Background(), 1)
		require.NoError(t, err)
		require.Empty(t, affinities)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestAffinityRepository_Upsert(t *testing.T) {
	t.Parallel()

	t.Run("new affinity", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewAffinityRepository(&postgres.DB{Pool: mock})

		mock.ExpectExec(`INSERT INTO user_affinities \(user_id, dimension, value, score\) VALUES \(\$1, \$2, \$3, \$4\) ON CONFLICT \(user_id, dimension, value\) DO UPDATE SET score = user_affinities\.score \+ \$4, confidence = user_affinities\.confidence \+ 0\.1, last_updated = NOW\(\)`).
			WithArgs(int64(1), "genre", "Action", 1.0).
			WillReturnResult(pgxmock.NewResult("INSERT", 1))

		err = repo.Upsert(context.Background(), 1, "genre", "Action", 1.0)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}
