package handler_test

import (
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

func setupPreferenceTest(t *testing.T) (*mocks.MockPreferenceService, *echo.Echo) {
	t.Helper()
	mockSvc := mocks.NewMockPreferenceService(t)
	e := echo.New()
	return mockSvc, e
}

func TestPreferenceHandler_GetPreference(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupPreferenceTest(t)
		h := handler.NewPreferenceHandler(e, mockSvc)

		req := httptest.NewRequest(http.MethodGet, "/v1/me/preferences", nil)
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		expected := &domain.Preference{
			UserID:         1,
			FavoriteGenres: []int{28, 12},
			Languages:      []string{"en"},
			MinRating:      6.0,
			MinYear:        1990,
			MaxYear:        2025,
		}

		mockSvc.EXPECT().
			GetByUserID(mock.Anything, int64(1)).
			Return(expected, nil)

		err := h.GetPreference(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]*domain.Preference
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.Equal(t, []int{28, 12}, resp["preference"].FavoriteGenres)
	})

	t.Run("not found", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupPreferenceTest(t)
		h := handler.NewPreferenceHandler(e, mockSvc)

		req := httptest.NewRequest(http.MethodGet, "/v1/me/preferences", nil)
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		mockSvc.EXPECT().
			GetByUserID(mock.Anything, int64(1)).
			Return(nil, nil)

		err := h.GetPreference(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]*domain.Preference
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.Nil(t, resp["preference"])
	})
}

func TestPreferenceHandler_UpsertPreference(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupPreferenceTest(t)
		h := handler.NewPreferenceHandler(e, mockSvc)

		body := `{"favorite_genres":[28],"languages":["en"],"min_rating":6.0,"min_year":1990,"max_year":2025}`
		req := httptest.NewRequest(http.MethodPut, "/v1/me/preferences", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		mockSvc.EXPECT().
			Upsert(mock.Anything, mock.MatchedBy(func(p *domain.Preference) bool {
				return p.UserID == 1 && p.MinYear == 1990 && p.MaxYear == 2025
			})).
			Return(nil)

		err := h.UpsertPreference(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]*domain.Preference
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.NotNil(t, resp["preference"])
	})

	t.Run("invalid request body", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupPreferenceTest(t)
		h := handler.NewPreferenceHandler(e, mockSvc)

		body := `{invalid json`
		req := httptest.NewRequest(http.MethodPut, "/v1/me/preferences", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.UpsertPreference(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupPreferenceTest(t)
		h := handler.NewPreferenceHandler(e, mockSvc)

		body := `{"min_rating":15}`
		req := httptest.NewRequest(http.MethodPut, "/v1/me/preferences", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.UpsertPreference(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})
}
