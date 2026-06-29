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

func TestTokenRepository_Insert(t *testing.T) {
	mock, err := pgxmock.NewPool()
	require.NoError(t, err)
	defer mock.Close()

	repo := postgres.NewTokenRepository(mock)

	token := &domain.Token{
		Hash:   []byte("test-hash"),
		UserID: 1,
		Expiry: time.Now().Add(time.Hour),
		Scope:  "activation",
	}

	mock.ExpectExec("INSERT INTO tokens").
		WithArgs([]byte("test-hash"), int64(1), pgxmock.AnyArg(), "activation").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = repo.Insert(context.Background(), token)
	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestTokenRepository_DeleteAllForUser(t *testing.T) {
	mock, err := pgxmock.NewPool()
	require.NoError(t, err)
	defer mock.Close()

	repo := postgres.NewTokenRepository(mock)

	mock.ExpectExec("DELETE FROM tokens").
		WithArgs("activation", int64(1)).
		WillReturnResult(pgxmock.NewResult("DELETE", 2))

	err = repo.DeleteAllForUser(context.Background(), "activation", 1)
	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
}
