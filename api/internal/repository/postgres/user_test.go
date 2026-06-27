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

func TestUserRepository_GetByToken(t *testing.T) {
	mock, err := pgxmock.NewPool()
	require.NoError(t, err)
	defer mock.Close()

	repo := postgres.NewUserRepository(mock)

	now := time.Now()
	tokenPlain := "reset-token-abc123"
	scope := "password_reset"
	hash := sha256.Sum256([]byte(tokenPlain))

	mock.ExpectQuery("SELECT users.id, users.name, users.email, users.password_hash, users.activated, users.suspended_at, users.onboarded, users.skips_remaining, users.syncs_remaining, users.last_reset_at, users.version, users.created_at, users.updated_at\\s+FROM users\\s+INNER JOIN tokens ON users.id = tokens.user_id\\s+WHERE tokens.hash = \\$1\\s+AND tokens.scope = \\$2\\s+AND tokens.expiry > now\\(\\)").
		WithArgs(hash[:], scope).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "name", "email", "password_hash", "activated", "suspended_at",
			"onboarded", "skips_remaining", "syncs_remaining", "last_reset_at",
			"version", "created_at", "updated_at",
		}).AddRow(1, "John", "john@test.com", []byte("hash_123"), false, nil, false, 3, 3, now, 1, now, now))

	user, err := repo.GetByToken(context.Background(), tokenPlain, scope)
	require.NoError(t, err)
	require.NotNil(t, user)
	require.Equal(t, int64(1), user.ID)
	require.Equal(t, "John", user.Name)
	require.Equal(t, "john@test.com", user.Email)
	require.Equal(t, false, user.Activated)
	require.Equal(t, 1, user.Version)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_Update(t *testing.T) {
	now := time.Now()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewUserRepository(mock)

		user := &domain.User{
			ID:       1,
			Name:     "John Updated",
			Email:    "john@test.com",
			Activated: true,
			Version:  1,
		}
		user.Password.Hash = []byte("newhash")

		mock.ExpectQuery("UPDATE users").
			WithArgs("John Updated", "john@test.com", []byte("newhash"), true, int64(1), 1).
			WillReturnRows(pgxmock.NewRows([]string{
				"id", "name", "email", "password_hash", "activated", "suspended_at",
				"onboarded", "skips_remaining", "syncs_remaining", "last_reset_at",
				"version", "created_at", "updated_at",
			}).AddRow(1, "John Updated", "john@test.com", []byte("newhash"), true, nil,
				false, 3, 3, now, 2, now, now))

		err = repo.Update(context.Background(), user)
		require.NoError(t, err)
		require.Equal(t, 2, user.Version)
		require.Equal(t, "John Updated", user.Name)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("edit conflict", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewUserRepository(mock)

		user := &domain.User{
			ID:      1,
			Name:    "John",
			Email:   "john@test.com",
			Version: 1,
		}
		user.Password.Hash = []byte("hash")

		mock.ExpectQuery("UPDATE users").
			WithArgs("John", "john@test.com", []byte("hash"), false, int64(1), 1).
			WillReturnRows(pgxmock.NewRows([]string{
				"id", "name", "email", "password_hash", "activated", "suspended_at",
				"onboarded", "skips_remaining", "syncs_remaining", "last_reset_at",
				"version", "created_at", "updated_at",
			}))

		err = repo.Update(context.Background(), user)
		require.ErrorIs(t, err, domain.ErrEditConflict)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}
