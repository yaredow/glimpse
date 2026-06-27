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

func TestUserRepository_Create(t *testing.T) {
	mock, err := pgxmock.NewPool()
	require.NoError(t, err)
	defer mock.Close()

	repo := postgres.NewUserRepository(mock)

	now := time.Now()
	mock.ExpectQuery("INSERT INTO users").
		WithArgs("John", "john@test.com", []byte("hash123")).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "activated", "onboarded", "skips_remaining", "syncs_remaining",
			"last_reset_at", "version", "created_at",
		}).AddRow(1, false, false, 3, 3, now, 1, now))

	user := &domain.User{
		Name:  "John",
		Email: "john@test.com",
	}
	user.Password.Hash = []byte("hash123")

	err = repo.Create(context.Background(), user)
	require.NoError(t, err)
	require.Equal(t, int64(1), user.ID)
	require.Equal(t, false, user.Activated)
	require.Equal(t, 3, user.SkipsRemaining)
	require.Equal(t, 1, user.Version)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_GetByEmail(t *testing.T) {
	mock, err := pgxmock.NewPool()
	require.NoError(t, err)
	defer mock.Close()

	repo := postgres.NewUserRepository(mock)

	now := time.Now()
	email := "john@test.com"
	mock.ExpectQuery("SELECT id, name, email, password_hash, activated, suspended_at, onboarded, skips_remaining, syncs_remaining, last_reset_at, version, created_at, updated_at\\s+From users\\s+WHERE email = \\$1").WithArgs(email).WillReturnRows(
		pgxmock.NewRows([]string{
			"id", "name", "email", "password_hash", "activated", "suspended_at", "onboarded",
			"skips_remaining", "syncs_remaining", "last_reset_at", "version", "created_at",
			"updated_at",
		}).AddRow(1, "John", email, []byte("hash_123"), false, nil, false, 3, 3, now, 1, now, now))

	user, err := repo.GetByEmail(context.Background(), email)
	require.NoError(t, err)
	require.NotNil(t, user)
	require.Equal(t, int64(1), user.ID)
	require.Equal(t, "John", user.Name)
	require.Equal(t, email, user.Email)
	require.Equal(t, []byte("hash_123"), user.Password.Hash)
	require.NoError(t, mock.ExpectationsWereMet())
}
