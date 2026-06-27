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

func TestUserService_Create(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)

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

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)

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

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)

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

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)

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

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)
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

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)

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

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)

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

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)

		user, err := svc.GetByEmail(context.Background(), "")
		require.Nil(t, user)
		require.ErrorIs(t, err, domain.ErrInvalidEmail)
	})

	t.Run("invalid email", func(t *testing.T) {
		t.Parallel()

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)

		user, err := svc.GetByEmail(context.Background(), "not-an-email")
		require.Nil(t, user)
		require.ErrorIs(t, err, domain.ErrInvalidEmail)
	})

	t.Run("not found", func(t *testing.T) {
		t.Parallel()

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "missing@test.com").
			Return(nil, domain.ErrNotFound)

		user, err := svc.GetByEmail(context.Background(), "missing@test.com")
		require.Nil(t, user)
		require.ErrorIs(t, err, domain.ErrNotFound)
	})

	t.Run("repo error", func(t *testing.T) {
		t.Parallel()

		mockRepo := mocks.NewMockUserRepository(t)
		svc := service.NewUserService(mockRepo)
		repoErr := errors.New("db connection failed")

		mockRepo.EXPECT().
			GetByEmail(mock.Anything, "john@test.com").
			Return(nil, repoErr)

		user, err := svc.GetByEmail(context.Background(), "john@test.com")
		require.Nil(t, user)
		require.ErrorIs(t, err, repoErr)
	})
}
