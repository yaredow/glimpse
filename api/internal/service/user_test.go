package service_test

import (
	"context"
	"errors"
	"strings"
	"testing"

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
