package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/service"
	"github.com/yaredow/glimpse-api/internal/service/mocks"
)

func newPreferenceService(t *testing.T) (*mocks.MockPreferenceRepository, *service.PreferenceService) {
	t.Helper()
	mockRepo := mocks.NewMockPreferenceRepository(t)
	svc := service.NewPreferenceService(mockRepo)
	return mockRepo, svc
}

func TestPreferenceService_GetByUserID(t *testing.T) {
	t.Parallel()

	t.Run("found", func(t *testing.T) {
		t.Parallel()

		mockRepo, svc := newPreferenceService(t)

		expected := &domain.Preference{
			UserID:         1,
			FavoriteGenres: []int{28, 12},
			ExcludedGenres: []int{99},
			Languages:      []string{"en"},
			MinRating:      6.0,
			MinYear:        1990,
			MaxYear:        2025,
		}

		mockRepo.EXPECT().
			GetByUserID(mock.Anything, int64(1)).
			Return(expected, nil)

		p, err := svc.GetByUserID(context.Background(), 1)
		require.NoError(t, err)
		require.Equal(t, expected, p)
	})

	t.Run("not found", func(t *testing.T) {
		t.Parallel()

		mockRepo, svc := newPreferenceService(t)

		mockRepo.EXPECT().
			GetByUserID(mock.Anything, int64(99)).
			Return(nil, nil)

		p, err := svc.GetByUserID(context.Background(), 99)
		require.NoError(t, err)
		require.Nil(t, p)
	})
}

func TestPreferenceService_Upsert(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockRepo, svc := newPreferenceService(t)

		p := &domain.Preference{
			UserID:         1,
			FavoriteGenres: []int{28},
			Languages:      []string{"en"},
			MinRating:      6.0,
			MinYear:        1990,
			MaxYear:        2025,
		}

		mockRepo.EXPECT().
			Upsert(mock.Anything, mock.MatchedBy(func(pr *domain.Preference) bool {
				return pr.UserID == 1 && pr.MinYear == 1990 && pr.MaxYear == 2025
			})).
			Return(nil)

		err := svc.Upsert(context.Background(), p)
		require.NoError(t, err)
	})

	t.Run("defaults languages to en", func(t *testing.T) {
		t.Parallel()

		mockRepo, svc := newPreferenceService(t)

		p := &domain.Preference{
			UserID:    1,
			MinRating: 5.0,
			MinYear:   2000,
			MaxYear:   2024,
		}

		mockRepo.EXPECT().
			Upsert(mock.Anything, mock.MatchedBy(func(pr *domain.Preference) bool {
				return len(pr.Languages) == 1 && pr.Languages[0] == "en"
			})).
			Return(nil)

		err := svc.Upsert(context.Background(), p)
		require.NoError(t, err)
	})

	t.Run("invalid year range", func(t *testing.T) {
		t.Parallel()

		_, svc := newPreferenceService(t)

		p := &domain.Preference{
			UserID:    1,
			Languages: []string{"en"},
			MinYear:   2025,
			MaxYear:   2000,
		}

		err := svc.Upsert(context.Background(), p)
		require.ErrorIs(t, err, domain.ErrBadParamInput)
	})
}
