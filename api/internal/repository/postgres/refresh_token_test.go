package postgres_test

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/pashagolub/pgxmock/v5"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
)

func TestRefreshTokenRepository_Insert(t *testing.T) {
	mock, err := pgxmock.NewPool()
	require.NoError(t, err)
	defer mock.Close()

	repo := postgres.NewRefreshTokenRepository(mock)

	token := &domain.RefreshToken{
		Hash:      []byte("test-hash"),
		UserID:    1,
		ExpiresAt: time.Now().Add(time.Hour),
		CreatedAt: time.Now(),
		FamilyID:  "test-family-uuid",
	}

	mock.ExpectExec("INSERT INTO refresh_tokens").
		WithArgs([]byte("test-hash"), int64(1), pgxmock.AnyArg(), pgxmock.AnyArg(), "test-family-uuid").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = repo.Insert(context.Background(), token)
	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestRefreshTokenRepository_DeleteAllForUser(t *testing.T) {
	mock, err := pgxmock.NewPool()
	require.NoError(t, err)
	defer mock.Close()

	repo := postgres.NewRefreshTokenRepository(mock)

	mock.ExpectExec("DELETE FROM refresh_tokens").
		WithArgs(int64(1)).
		WillReturnResult(pgxmock.NewResult("DELETE", 2))

	err = repo.DeleteAllForUser(context.Background(), 1)
	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestRefreshTokenRepository_GetByPlainText(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		now := time.Now()
		rows := pgxmock.NewRows([]string{"hash", "user_id", "expires_at", "created_at", "revoked_at", "family_id", "replaced_by_hash"}).
			AddRow([]byte("hashed-value"), int64(1), now, now, nil, "family-uuid", nil)

		mock.ExpectQuery("SELECT hash, user_id, expires_at, created_at, revoked_at, family_id, replaced_by_hash FROM refresh_tokens WHERE").
			WithArgs(pgxmock.AnyArg()).
			WillReturnRows(rows)

		rt, err := repo.GetByPlainText(context.Background(), "plain-text-token")
		require.NoError(t, err)
		require.NotNil(t, rt)
		require.Equal(t, int64(1), rt.UserID)
		require.Equal(t, "family-uuid", rt.FamilyID)
		require.Nil(t, rt.RevokedAt)
		require.Nil(t, rt.ReplacedBy)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("not found", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		mock.ExpectQuery("SELECT hash, user_id, expires_at, created_at, revoked_at, family_id, replaced_by_hash FROM refresh_tokens WHERE").
			WithArgs(pgxmock.AnyArg()).
			WillReturnError(pgx.ErrNoRows)

		rt, err := repo.GetByPlainText(context.Background(), "bad-token")
		require.Nil(t, rt)
		require.ErrorIs(t, err, domain.ErrNotFound)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestRefreshTokenRepository_Rotate(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		old := &domain.RefreshToken{
			Hash:     []byte("old-hash"),
			UserID:   1,
			FamilyID: "family-uuid",
		}
		newToken := &domain.RefreshToken{
			Hash:      []byte("new-hash"),
			UserID:    1,
			ExpiresAt: time.Now().Add(time.Hour),
			CreatedAt: time.Now(),
			FamilyID:  "family-uuid",
		}

		mock.ExpectBegin()
		mock.ExpectExec("INSERT INTO refresh_tokens").
			WithArgs([]byte("new-hash"), int64(1), pgxmock.AnyArg(), pgxmock.AnyArg(), "family-uuid").
			WillReturnResult(pgxmock.NewResult("INSERT", 1))
		mock.ExpectExec("UPDATE refresh_tokens SET revoked_at").
			WithArgs([]byte("new-hash"), []byte("old-hash")).
			WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectCommit()

		result, err := repo.Rotate(context.Background(), old, newToken)
		require.NoError(t, err)
		require.Equal(t, newToken, result)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("begin fails", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		mock.ExpectBegin().WillReturnError(pgx.ErrTxClosed)

		result, err := repo.Rotate(context.Background(), &domain.RefreshToken{}, &domain.RefreshToken{})
		require.Error(t, err)
		require.Nil(t, result)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("insert fails", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		old := &domain.RefreshToken{
			Hash:     []byte("old-hash"),
			UserID:   1,
			FamilyID: "family-uuid",
		}
		newToken := &domain.RefreshToken{
			Hash:      []byte("new-hash"),
			UserID:    1,
			ExpiresAt: time.Now().Add(time.Hour),
			CreatedAt: time.Now(),
			FamilyID:  "family-uuid",
		}

		mock.ExpectBegin()
		mock.ExpectExec("INSERT INTO refresh_tokens").
			WithArgs([]byte("new-hash"), int64(1), pgxmock.AnyArg(), pgxmock.AnyArg(), "family-uuid").
			WillReturnError(pgx.ErrTxClosed)

		result, err := repo.Rotate(context.Background(), old, newToken)
		require.Error(t, err)
		require.Nil(t, result)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("old token not found", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		old := &domain.RefreshToken{
			Hash:     []byte("old-hash"),
			UserID:   1,
			FamilyID: "family-uuid",
		}
		newToken := &domain.RefreshToken{
			Hash:      []byte("new-hash"),
			UserID:    1,
			ExpiresAt: time.Now().Add(time.Hour),
			CreatedAt: time.Now(),
			FamilyID:  "family-uuid",
		}

		mock.ExpectBegin()
		mock.ExpectExec("INSERT INTO refresh_tokens").
			WithArgs([]byte("new-hash"), int64(1), pgxmock.AnyArg(), pgxmock.AnyArg(), "family-uuid").
			WillReturnResult(pgxmock.NewResult("INSERT", 1))
		mock.ExpectExec("UPDATE refresh_tokens SET revoked_at").
			WithArgs([]byte("new-hash"), []byte("old-hash")).
			WillReturnResult(pgxmock.NewResult("UPDATE", 0))

		result, err := repo.Rotate(context.Background(), old, newToken)
		require.ErrorIs(t, err, domain.ErrNotFound)
		require.Nil(t, result)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestRefreshTokenRepository_RevokeByHash(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		mock.ExpectExec("UPDATE refresh_tokens SET revoked_at").
			WithArgs([]byte("hash-value")).
			WillReturnResult(pgxmock.NewResult("UPDATE", 1))

		err = repo.RevokeByHash(context.Background(), []byte("hash-value"))
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("not found", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		mock.ExpectExec("UPDATE refresh_tokens SET revoked_at").
			WithArgs([]byte("hash-value")).
			WillReturnResult(pgxmock.NewResult("UPDATE", 0))

		err = repo.RevokeByHash(context.Background(), []byte("hash-value"))
		require.ErrorIs(t, err, domain.ErrNotFound)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestRefreshTokenRepository_RevokeByFamily(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		mock.ExpectExec("UPDATE refresh_tokens SET revoked_at").
			WithArgs("family-uuid").
			WillReturnResult(pgxmock.NewResult("UPDATE", 2))

		err = repo.RevokeByFamily(context.Background(), "family-uuid")
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("no tokens to revoke", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewRefreshTokenRepository(mock)

		mock.ExpectExec("UPDATE refresh_tokens SET revoked_at").
			WithArgs("family-uuid").
			WillReturnResult(pgxmock.NewResult("UPDATE", 0))

		err = repo.RevokeByFamily(context.Background(), "family-uuid")
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}
