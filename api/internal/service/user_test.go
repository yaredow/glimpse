package service_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/service"
	"github.com/yaredow/glimpse-api/internal/service/mocks"
)

func newUserService(t *testing.T) (*mocks.MockUserRepository, *mocks.MockTokenRepository, *mocks.MockRefreshTokenRepository, *service.UserService) {
	t.Helper()
	mockRepo := mocks.NewMockUserRepository(t)
	mockTokenRepo := mocks.NewMockTokenRepository(t)
	mockRefreshTokenRepo := mocks.NewMockRefreshTokenRepository(t)
	svc := service.NewUserService(mockRepo, mockTokenRepo, mockRefreshTokenRepo)
	return mockRepo, mockTokenRepo, mockRefreshTokenRepo, svc
}

func TestUserService_Create(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		user := &domain.User{
			Name:     "John",
			Email:    "john@test.com",
			Password: domain.Password{PlainText: "password123"},
		}

		mockRepo.EXPECT().
			Create(mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
				return u.Name == "John" && u.Email == "john@test.com"
			})).
			Return(nil)

		err := svc.Create(context.Background(), user)
		require.NoError(t, err)
		require.True(t, strings.HasPrefix(string(user.Password.Hash), "$2a$"), "password should be bcrypt hashed")
	})

	t.Run("missing name", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		user := &domain.User{
			Name:     "",
			Email:    "john@test.com",
			Password: domain.Password{PlainText: "password123"},
		}

		err := svc.Create(context.Background(), user)
		require.ErrorIs(t, err, domain.ErrNameRequired)
	})

	t.Run("invalid email", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		user := &domain.User{
			Name:     "John",
			Email:    "not-an-email",
			Password: domain.Password{PlainText: "password123"},
		}

		err := svc.Create(context.Background(), user)
		require.ErrorIs(t, err, domain.ErrInvalidEmail)
	})

	t.Run("short password", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		user := &domain.User{
			Name:     "John",
			Email:    "john@test.com",
			Password: domain.Password{PlainText: "abc"},
		}

		err := svc.Create(context.Background(), user)
		require.ErrorIs(t, err, domain.ErrPasswordTooShort)
	})

	t.Run("repo error", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)
		repoErr := errors.New("db connection failed")

		user := &domain.User{
			Name:     "John",
			Email:    "john@test.com",
			Password: domain.Password{PlainText: "password123"},
		}

		mockRepo.EXPECT().
			Create(mock.Anything, mock.Anything).
			Return(repoErr)

		err := svc.Create(context.Background(), user)
		require.ErrorIs(t, err, repoErr)
	})
}

func TestUserService_GetByEmail(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		expectedUser := &domain.User{
			ID:    1,
			Name:  "John",
			Email: "john@test.com",
		}

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(expectedUser, nil)

		user, err := svc.GetByEmail(context.Background(), "john@test.com")
		require.NoError(t, err)
		require.Equal(t, expectedUser, user)
	})

	t.Run("normalizes email", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		expectedUser := &domain.User{
			ID:    1,
			Name:  "John",
			Email: "john@test.com",
		}

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(expectedUser, nil)

		user, err := svc.GetByEmail(context.Background(), "  John@Test.com  ")
		require.NoError(t, err)
		require.Equal(t, expectedUser, user)
	})

	t.Run("empty email", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		user, err := svc.GetByEmail(context.Background(), "")
		require.Nil(t, user)
		require.ErrorIs(t, err, domain.ErrInvalidEmail)
	})

	t.Run("invalid email", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		user, err := svc.GetByEmail(context.Background(), "not-an-email")
		require.Nil(t, user)
		require.ErrorIs(t, err, domain.ErrInvalidEmail)
	})

	t.Run("not found", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "missing@test.com").
			Return(nil, domain.ErrNotFound)

		user, err := svc.GetByEmail(context.Background(), "missing@test.com")
		require.Nil(t, user)
		require.ErrorIs(t, err, domain.ErrNotFound)
	})

	t.Run("repo error", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)
		repoErr := errors.New("db connection failed")

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(nil, repoErr)

		user, err := svc.GetByEmail(context.Background(), "john@test.com")
		require.Nil(t, user)
		require.ErrorIs(t, err, repoErr)
	})
}

func TestUserService_Update(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		user := &domain.User{
			ID:    1,
			Name:  "John Updated",
			Email: "john@test.com",
		}

		mockRepo.EXPECT().
			Update(mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
				return u.Name == "John Updated" && u.Email == "john@test.com"
			})).
			Return(nil)

		err := svc.Update(context.Background(), user)
		require.NoError(t, err)
	})

	t.Run("missing name", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		user := &domain.User{
			ID:    1,
			Name:  "",
			Email: "john@test.com",
		}

		err := svc.Update(context.Background(), user)
		require.ErrorIs(t, err, domain.ErrNameRequired)
	})

	t.Run("invalid email", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		user := &domain.User{
			ID:    1,
			Name:  "John",
			Email: "not-an-email",
		}

		err := svc.Update(context.Background(), user)
		require.ErrorIs(t, err, domain.ErrInvalidEmail)
	})

	t.Run("repo error", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)
		repoErr := errors.New("db connection failed")

		user := &domain.User{
			ID:    1,
			Name:  "John",
			Email: "john@test.com",
		}

		mockRepo.EXPECT().
			Update(mock.Anything, mock.Anything).
			Return(repoErr)

		err := svc.Update(context.Background(), user)
		require.ErrorIs(t, err, repoErr)
	})
}

func TestUserService_Activate(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo, mockTokenRepo, _, svc := newUserService(t)

		user := &domain.User{
			ID:        1,
			Name:      "John",
			Email:     "john@test.com",
			Activated: false,
			Version:   1,
		}

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "valid-token", "activation").
			Return(user, nil)

		mockRepo.EXPECT().
			Update(mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
				return u.ID == 1 && u.Activated
			})).
			Return(nil)

		mockTokenRepo.EXPECT().
			DeleteAllForUser(mock.Anything, "activation", int64(1)).
			Return(nil)

		gotUser, err := svc.Activate(context.Background(), "valid-token")
		require.NoError(t, err)
		require.True(t, gotUser.Activated)
	})

	t.Run("token not found", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "bad-token", "activation").
			Return(nil, domain.ErrNotFound)

		user, err := svc.Activate(context.Background(), "bad-token")
		require.Nil(t, user)
		require.ErrorIs(t, err, domain.ErrNotFound)
	})

	t.Run("repo error on get by token", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)
		repoErr := errors.New("db connection failed")

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "token", "activation").
			Return(nil, repoErr)

		user, err := svc.Activate(context.Background(), "token")
		require.Nil(t, user)
		require.ErrorIs(t, err, repoErr)
	})

	t.Run("repo error on update", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)
		repoErr := errors.New("update failed")

		user := &domain.User{ID: 1, Activated: false, Version: 1}

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "token", "activation").
			Return(user, nil)

		mockRepo.EXPECT().
			Update(mock.Anything, mock.Anything).
			Return(repoErr)

		gotUser, err := svc.Activate(context.Background(), "token")
		require.Nil(t, gotUser)
		require.ErrorIs(t, err, repoErr)
	})

	t.Run("repo error on delete tokens", func(t *testing.T) {
		t.Parallel()

		mockRepo, mockTokenRepo, _, svc := newUserService(t)
		repoErr := errors.New("delete failed")

		user := &domain.User{ID: 1, Activated: false, Version: 1}

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "token", "activation").
			Return(user, nil)

		mockRepo.EXPECT().
			Update(mock.Anything, mock.Anything).
			Return(nil)

		mockTokenRepo.EXPECT().
			DeleteAllForUser(mock.Anything, "activation", int64(1)).
			Return(repoErr)

		gotUser, err := svc.Activate(context.Background(), "token")
		require.Nil(t, gotUser)
		require.ErrorIs(t, err, repoErr)
	})
}

func TestUserService_GetByToken(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		expectedUser := &domain.User{
			ID:    1,
			Name:  "John",
			Email: "john@test.com",
		}

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "token-abc", "password_reset").
			Return(expectedUser, nil)

		user, err := svc.GetByToken(context.Background(), "token-abc", "password_reset")
		require.NoError(t, err)
		require.Equal(t, expectedUser, user)
	})

	t.Run("not found", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "bad-token", "password_reset").
			Return(nil, domain.ErrNotFound)

		user, err := svc.GetByToken(context.Background(), "bad-token", "password_reset")
		require.Nil(t, user)
		require.ErrorIs(t, err, domain.ErrNotFound)
	})

	t.Run("repo error", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)
		repoErr := errors.New("db connection failed")

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "token-abc", "password_reset").
			Return(nil, repoErr)

		user, err := svc.GetByToken(context.Background(), "token-abc", "password_reset")
		require.Nil(t, user)
		require.ErrorIs(t, err, repoErr)
	})
}

func TestUserService_Authenticate(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, mockRefreshTokenRepo, svc := newUserService(t)

		user := &domain.User{
			ID:    1,
			Name:  "John",
			Email: "john@test.com",
			Password: domain.Password{
				PlainText: "password123",
			},
		}
		user.Password.Set("password123")

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(user, nil)

		mockRefreshTokenRepo.EXPECT().
			DeleteAllForUser(mock.Anything, int64(1)).
			Return(nil)

		mockRefreshTokenRepo.EXPECT().
			Insert(mock.Anything, mock.MatchedBy(func(rt *domain.RefreshToken) bool {
				return rt.UserID == 1 && rt.Plaintext != "" && rt.FamilyID != ""
			})).
			Return(nil)

		gotUser, gotToken, err := svc.Authenticate(context.Background(), "john@test.com", "password123")
		require.NoError(t, err)
		require.Equal(t, user, gotUser)
		require.NotNil(t, gotToken)
		require.NotEmpty(t, gotToken.Plaintext)
		require.NotEmpty(t, gotToken.FamilyID)
	})

	t.Run("invalid email", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		user, token, err := svc.Authenticate(context.Background(), "not-an-email", "password123")
		require.Nil(t, user)
		require.Nil(t, token)
		require.ErrorIs(t, err, domain.ErrInvalidEmail)
	})

	t.Run("user not found", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "missing@test.com").
			Return(nil, domain.ErrNotFound)

		user, token, err := svc.Authenticate(context.Background(), "missing@test.com", "password123")
		require.Nil(t, user)
		require.Nil(t, token)
		require.ErrorIs(t, err, domain.ErrInvalidCredentials)
	})

	t.Run("wrong password", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		user := &domain.User{
			ID:    1,
			Email: "john@test.com",
		}
		user.Password.Set("correct-password")

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(user, nil)

		gotUser, gotToken, err := svc.Authenticate(context.Background(), "john@test.com", "wrong-password")
		require.Nil(t, gotUser)
		require.Nil(t, gotToken)
		require.ErrorIs(t, err, domain.ErrInvalidCredentials)
	})

	t.Run("repo error on get by email", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)
		repoErr := errors.New("db connection failed")

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(nil, repoErr)

		user, token, err := svc.Authenticate(context.Background(), "john@test.com", "password123")
		require.Nil(t, user)
		require.Nil(t, token)
		require.ErrorIs(t, err, repoErr)
	})

	t.Run("normalizes email", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, mockRefreshTokenRepo, svc := newUserService(t)

		user := &domain.User{
			ID:    1,
			Name:  "John",
			Email: "john@test.com",
		}
		user.Password.Set("password123")

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(user, nil)

		mockRefreshTokenRepo.EXPECT().
			DeleteAllForUser(mock.Anything, int64(1)).
			Return(nil)

		mockRefreshTokenRepo.EXPECT().
			Insert(mock.Anything, mock.Anything).
			Return(nil)

		gotUser, gotToken, err := svc.Authenticate(context.Background(), "  John@Test.com  ", "password123")
		require.NoError(t, err)
		require.Equal(t, user, gotUser)
		require.NotNil(t, gotToken)
	})
}

func TestUserService_RotateRefreshToken(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		_, _, mockRefreshTokenRepo, svc := newUserService(t)

		old := &domain.RefreshToken{
			Hash:      []byte("old-hash"),
			UserID:    1,
			ExpiresAt: time.Now().Add(time.Hour),
			FamilyID:  "family-uuid",
		}

		newToken := &domain.RefreshToken{
			Plaintext: "new-plaintext",
			Hash:      []byte("new-hash"),
			UserID:    1,
			ExpiresAt: time.Now().Add(time.Hour),
			CreatedAt: time.Now(),
			FamilyID:  "family-uuid",
		}

		mockRefreshTokenRepo.EXPECT().
			GetByPlainText(mock.Anything, "old-plaintext").
			Return(old, nil)

		mockRefreshTokenRepo.EXPECT().
			Rotate(mock.Anything, old, mock.MatchedBy(func(rt *domain.RefreshToken) bool {
				return rt.UserID == 1 && rt.FamilyID == "family-uuid"
			})).
			Return(newToken, nil)

		result, err := svc.RotateRefreshToken(context.Background(), "old-plaintext")
		require.NoError(t, err)
		require.Equal(t, newToken, result)
	})

	t.Run("old token not found", func(t *testing.T) {
		t.Parallel()

		_, _, mockRefreshTokenRepo, svc := newUserService(t)

		mockRefreshTokenRepo.EXPECT().
			GetByPlainText(mock.Anything, "bad-token").
			Return(nil, domain.ErrNotFound)

		result, err := svc.RotateRefreshToken(context.Background(), "bad-token")
		require.Nil(t, result)
		require.ErrorIs(t, err, domain.ErrNotFound)
	})

	t.Run("token is revoked", func(t *testing.T) {
		t.Parallel()

		_, _, mockRefreshTokenRepo, svc := newUserService(t)

		now := time.Now()
		old := &domain.RefreshToken{
			Hash:      []byte("old-hash"),
			UserID:    1,
			ExpiresAt: now.Add(time.Hour),
			RevokedAt: &now,
			FamilyID:  "family-uuid",
		}

		mockRefreshTokenRepo.EXPECT().
			GetByPlainText(mock.Anything, "revoked-token").
			Return(old, nil)

		result, err := svc.RotateRefreshToken(context.Background(), "revoked-token")
		require.Nil(t, result)
		require.ErrorIs(t, err, domain.ErrNotFound)
	})

	t.Run("token is revoked with reuse detection", func(t *testing.T) {
		t.Parallel()

		_, _, mockRefreshTokenRepo, svc := newUserService(t)

		now := time.Now()
		old := &domain.RefreshToken{
			Hash:       []byte("old-hash"),
			UserID:     1,
			ExpiresAt:  now.Add(time.Hour),
			RevokedAt:  &now,
			FamilyID:   "family-uuid",
			ReplacedBy: []byte("newer-hash"),
		}

		mockRefreshTokenRepo.EXPECT().
			GetByPlainText(mock.Anything, "reused-token").
			Return(old, nil)

		mockRefreshTokenRepo.EXPECT().
			RevokeByFamily(mock.Anything, "family-uuid").
			Return(nil)

		result, err := svc.RotateRefreshToken(context.Background(), "reused-token")
		require.Nil(t, result)
		require.ErrorIs(t, err, domain.ErrNotFound)
	})

	t.Run("token is expired", func(t *testing.T) {
		t.Parallel()

		_, _, mockRefreshTokenRepo, svc := newUserService(t)

		old := &domain.RefreshToken{
			Hash:      []byte("old-hash"),
			UserID:    1,
			ExpiresAt: time.Now().Add(-time.Hour),
			FamilyID:  "family-uuid",
		}

		mockRefreshTokenRepo.EXPECT().
			GetByPlainText(mock.Anything, "expired-token").
			Return(old, nil)

		result, err := svc.RotateRefreshToken(context.Background(), "expired-token")
		require.Nil(t, result)
		require.ErrorIs(t, err, domain.ErrNotFound)
	})

	t.Run("rotate fails", func(t *testing.T) {
		t.Parallel()

		_, _, mockRefreshTokenRepo, svc := newUserService(t)

		old := &domain.RefreshToken{
			Hash:      []byte("old-hash"),
			UserID:    1,
			ExpiresAt: time.Now().Add(time.Hour),
			FamilyID:  "family-uuid",
		}

		mockRefreshTokenRepo.EXPECT().
			GetByPlainText(mock.Anything, "old-plaintext").
			Return(old, nil)

		mockRefreshTokenRepo.EXPECT().
			Rotate(mock.Anything, old, mock.Anything).
			Return(nil, domain.ErrNotFound)

		result, err := svc.RotateRefreshToken(context.Background(), "old-plaintext")
		require.Nil(t, result)
		require.ErrorIs(t, err, domain.ErrNotFound)
	})
}

func TestUserService_RequestPasswordReset(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo, mockTokenRepo, _, svc := newUserService(t)

		user := &domain.User{ID: 1, Email: "john@test.com"}

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(user, nil)

		mockTokenRepo.EXPECT().
			DeleteAllForUser(mock.Anything, "password_reset", int64(1)).
			Return(nil)

		mockTokenRepo.EXPECT().
			Insert(mock.Anything, mock.MatchedBy(func(t *domain.Token) bool {
				return t.UserID == 1 && t.Scope == "password_reset"
			})).
			Return(nil)

		err := svc.RequestPasswordReset(context.Background(), "john@test.com")
		require.NoError(t, err)
	})

	t.Run("invalid email returns nil", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		err := svc.RequestPasswordReset(context.Background(), "not-an-email")
		require.NoError(t, err)
	})

	t.Run("unknown email returns nil", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "missing@test.com").
			Return(nil, domain.ErrNotFound)

		err := svc.RequestPasswordReset(context.Background(), "missing@test.com")
		require.NoError(t, err)
	})

	t.Run("normalizes email", func(t *testing.T) {
		t.Parallel()

		mockRepo, mockTokenRepo, _, svc := newUserService(t)

		user := &domain.User{ID: 1, Email: "john@test.com"}

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(user, nil)

		mockTokenRepo.EXPECT().
			DeleteAllForUser(mock.Anything, "password_reset", int64(1)).
			Return(nil)

		mockTokenRepo.EXPECT().
			Insert(mock.Anything, mock.Anything).
			Return(nil)

		err := svc.RequestPasswordReset(context.Background(), "  John@Test.com  ")
		require.NoError(t, err)
	})

	t.Run("repo error on get by email", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)
		repoErr := errors.New("db connection failed")

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(nil, repoErr)

		err := svc.RequestPasswordReset(context.Background(), "john@test.com")
		require.ErrorIs(t, err, repoErr)
	})
}

func TestUserService_ResetPassword(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo, mockTokenRepo, _, svc := newUserService(t)

		user := &domain.User{ID: 1, Version: 1}

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "valid-token", "password_reset").
			Return(user, nil)

		mockRepo.EXPECT().
			Update(mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
				return u.ID == 1 && len(u.Password.Hash) > 0
			})).
			Return(nil)

		mockTokenRepo.EXPECT().
			DeleteAllForUser(mock.Anything, "password_reset", int64(1)).
			Return(nil)

		err := svc.ResetPassword(context.Background(), "valid-token", "newpassword123")
		require.NoError(t, err)
	})

	t.Run("short password", func(t *testing.T) {
		t.Parallel()

		_, _, _, svc := newUserService(t)

		err := svc.ResetPassword(context.Background(), "token", "abc")
		require.ErrorIs(t, err, domain.ErrPasswordTooShort)
	})

	t.Run("token not found", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "bad-token", "password_reset").
			Return(nil, domain.ErrNotFound)

		err := svc.ResetPassword(context.Background(), "bad-token", "newpassword123")
		require.ErrorIs(t, err, domain.ErrNotFound)
	})

	t.Run("repo error on update", func(t *testing.T) {
		t.Parallel()

		mockRepo, _, _, svc := newUserService(t)
		repoErr := errors.New("update failed")

		user := &domain.User{ID: 1, Version: 1}

		mockRepo.EXPECT().
			GetByToken(mock.Anything, "token", "password_reset").
			Return(user, nil)

		mockRepo.EXPECT().
			Update(mock.Anything, mock.Anything).
			Return(repoErr)

		err := svc.ResetPassword(context.Background(), "token", "newpassword123")
		require.ErrorIs(t, err, repoErr)
	})
}
