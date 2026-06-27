package postgres_test

import (
	"context"
	"crypto/sha256"
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
	now := time.Now()

	token := &domain.Token{
		Hash:   []byte("test-hash"),
		UserID: 1,
		Expiry: now.Add(time.Hour),
		Scope:  "activation",
	}

	ock.ExpectExec("INSERT INTO tokens").
		WithArgs([]byte("test-hash"), int64(1), pgxmock.AnyArg(), "activation").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = repo.Insert(context.Background(), token)
	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestTokenRepository_New(t *testing.T) {
	mock, err := pgxmock.NewPool()
	require.NoError(t, err)
	defer mock.Close()

	repo := postgres.NewTokenRepository(mock)

	mock.ExpectExec("INSERT INTO tokens").
		WithArgs(pgxmock.AnyArg(), int64(42), pgxmock.AnyArg(), "activation").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	token, err := repo.New(context.Background(), 42, time.Hour, "activation")
	require.NoError(t, err)
	require.NotNil(t, token)
	require.Equal(t, int64(42), token.UserID)
	require.Equal(t, "activation", token.Scope)
	require.True(t, token.Expiry.After(time.Now()))
	require.NotEmpty(t, token.Plaintext)
	require.Len(t, token.Plaintext, 26)
	require.Len(t, token.Hash, 32)

	expectedHash := sha256.Sum256([]byte(token.Plaintext))
	require.Equal(t, expectedHash[:], token.Hash)

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
