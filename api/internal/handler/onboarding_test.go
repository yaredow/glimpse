package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/handler"
	"github.com/yaredow/glimpse-api/internal/handler/mocks"
)

type mockAffinitySeeder struct {
	mock.Mock
}

func (m *mockAffinitySeeder) SeedFromOnboarding(ctx context.Context, userID int64, genreIDs []int) error {
	args := m.Called(ctx, userID, genreIDs)
	return args.Error(0)
}

func setupOnboardingTest(t *testing.T) (*mocks.MockgenreLister, *mocks.MockpreferenceUpserter, *mocks.Mockonboarder, *mockAffinitySeeder) {
	t.Helper()
	mockGenreLister := mocks.NewMockgenreLister(t)
	mockPrefSvc := mocks.NewMockpreferenceUpserter(t)
	mockOnboarder := mocks.NewMockonboarder(t)
	mockAffSeed := &mockAffinitySeeder{}
	return mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed
}

func TestOnboardingHandler_Start(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed := setupOnboardingTest(t)
		h := handler.NewOnboardingHandler(mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed)
		e := echo.New()

		req := httptest.NewRequest(http.MethodPost, "/v1/onboarding/start", nil)
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		mockGenreLister.EXPECT().
			ListAllGenres(mock.Anything).
			Return([]domain.Genre{{ID: 28, Name: "Action"}, {ID: 12, Name: "Adventure"}}, nil)

		err := h.Start(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]any
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.NotNil(t, resp["genres"])
		require.NotNil(t, resp["languages"])
		require.NotNil(t, resp["eras"])
	})

	t.Run("repo error", func(t *testing.T) {
		t.Parallel()

		mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed := setupOnboardingTest(t)
		h := handler.NewOnboardingHandler(mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed)
		e := echo.New()

		req := httptest.NewRequest(http.MethodPost, "/v1/onboarding/start", nil)
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		mockGenreLister.EXPECT().
			ListAllGenres(mock.Anything).
			Return(nil, domain.ErrInternalServerError)

		err := h.Start(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}

func TestOnboardingHandler_Complete(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed := setupOnboardingTest(t)
		h := handler.NewOnboardingHandler(mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed)
		e := echo.New()

		body := `{"favorite_genres":[28,12],"languages":["en"],"min_rating":6.0,"min_year":1990,"max_year":2025}`
		req := httptest.NewRequest(http.MethodPost, "/v1/onboarding/finish", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		mockPrefSvc.EXPECT().
			Upsert(mock.Anything, mock.MatchedBy(func(p *domain.Preference) bool {
				return p.UserID == 1 && p.MinYear == 1990 && p.MaxYear == 2025
			})).
			Return(nil)

		mockOnboarder.EXPECT().
			UpdateOnboarded(mock.Anything, "1", true).
			Return(nil)

		mockAffSeed.On("SeedFromOnboarding", mock.Anything, int64(1), []int{28, 12}).
			Return(nil)

		err := h.Complete(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]*domain.Preference
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.NotNil(t, resp["preferences"])
		require.Equal(t, []int{28, 12}, resp["preferences"].FavoriteGenres)
	})

	t.Run("invalid request body", func(t *testing.T) {
		t.Parallel()

		mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed := setupOnboardingTest(t)
		h := handler.NewOnboardingHandler(mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed)
		e := echo.New()

		body := `{invalid json`
		req := httptest.NewRequest(http.MethodPost, "/v1/onboarding/finish", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.Complete(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		t.Parallel()

		mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed := setupOnboardingTest(t)
		h := handler.NewOnboardingHandler(mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed)
		e := echo.New()

		body := `{"min_rating":15}`
		req := httptest.NewRequest(http.MethodPost, "/v1/onboarding/finish", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.Complete(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("upsert error", func(t *testing.T) {
		t.Parallel()

		mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed := setupOnboardingTest(t)
		h := handler.NewOnboardingHandler(mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed)
		e := echo.New()

		body := `{"favorite_genres":[28],"languages":["en"],"min_rating":5.0,"min_year":1990,"max_year":2025}`
		req := httptest.NewRequest(http.MethodPost, "/v1/onboarding/finish", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		mockPrefSvc.EXPECT().
			Upsert(mock.Anything, mock.Anything).
			Return(domain.ErrInternalServerError)

		err := h.Complete(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusInternalServerError, rec.Code)
	})

	t.Run("onboard error", func(t *testing.T) {
		t.Parallel()

		mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed := setupOnboardingTest(t)
		h := handler.NewOnboardingHandler(mockGenreLister, mockPrefSvc, mockOnboarder, mockAffSeed)
		e := echo.New()

		body := `{"favorite_genres":[28],"languages":["en"],"min_rating":5.0,"min_year":1990,"max_year":2025}`
		req := httptest.NewRequest(http.MethodPost, "/v1/onboarding/finish", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		mockPrefSvc.EXPECT().
			Upsert(mock.Anything, mock.Anything).
			Return(nil)

		mockOnboarder.EXPECT().
			UpdateOnboarded(mock.Anything, "1", true).
			Return(domain.ErrInternalServerError)

		err := h.Complete(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}
