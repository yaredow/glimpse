package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/handler"
)

type mockGridService struct {
	mock.Mock
}

func (m *mockGridService) GenerateGrid(ctx context.Context, userID int64) ([]domain.GridSlotResponse, uuid.UUID, error) {
	args := m.Called(ctx, userID)
	grid, _ := args.Get(0).([]domain.GridSlotResponse)
	sid, _ := args.Get(1).(uuid.UUID)
	return grid, sid, args.Error(2)
}

func (m *mockGridService) RecordInteraction(ctx context.Context, userID, movieID int64, action string, sessionID uuid.UUID, gridPosition, revealActionMs *int) error {
	args := m.Called(ctx, userID, movieID, action, sessionID, gridPosition, revealActionMs)
	return args.Error(0)
}

func newRecHandlerTest(t *testing.T) (*mockGridService, *handler.RecommendationHandler, *echo.Echo) {
	t.Helper()
	mockSvc := &mockGridService{}
	h := handler.NewRecommendationHandler(mockSvc)
	e := echo.New()
	return mockSvc, h, e
}

// ─── GetGrid ──────────────────────────────────────────────────────────────

func TestRecommendationHandler_GetGrid(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		sessionID := uuid.New()
		grid := []domain.GridSlotResponse{
			{MovieID: 10, TmdbID: 100, SlotNumber: 1, IsRevealed: false, VagueDescription: "desc", Genres: []string{"Action"}, GridSessionID: sessionID},
			{MovieID: 11, TmdbID: 101, SlotNumber: 2, IsRevealed: false, VagueDescription: "desc", Genres: []string{"Comedy"}, GridSessionID: sessionID},
		}

		mockSvc.On("GenerateGrid", mock.Anything, int64(1)).Return(grid, sessionID, nil)

		req := httptest.NewRequest(http.MethodGet, "/v1/grid", nil)
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.GetGrid(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp map[string][]domain.GridSlotResponse
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.Len(t, resp["grid"], 2)
		require.Equal(t, int64(10), resp["grid"][0].MovieID)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		mockSvc.On("GenerateGrid", mock.Anything, int64(1)).Return(nil, uuid.Nil, domain.ErrInternalServerError)

		req := httptest.NewRequest(http.MethodGet, "/v1/grid", nil)
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.GetGrid(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}

// ─── RecordInteraction ────────────────────────────────────────────────────

func TestRecommendationHandler_RecordInteraction(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)
		sessionID := uuid.New()

		mockSvc.On("RecordInteraction", mock.Anything, int64(1), int64(10), "revealed", sessionID, mock.Anything, (*int)(nil)).
			Return(nil)

		body := `{"movie_id":10,"action":"revealed","grid_session_id":"` + sessionID.String() + `","grid_position":3}`
		req := httptest.NewRequest(http.MethodPost, "/v1/grid/interactions", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.RecordInteraction(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]string
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.Equal(t, "interaction recorded", resp["message"])
	})

	t.Run("invalid request body", func(t *testing.T) {
		t.Parallel()

		_, h, e := newRecHandlerTest(t)

		body := `{invalid json`
		req := httptest.NewRequest(http.MethodPost, "/v1/grid/interactions", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.RecordInteraction(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		t.Parallel()

		_, h, e := newRecHandlerTest(t)

		body := `{"movie_id":10}`
		req := httptest.NewRequest(http.MethodPost, "/v1/grid/interactions", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.RecordInteraction(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)
		sessionID := uuid.New()

		mockSvc.On("RecordInteraction", mock.Anything, int64(1), int64(10), "watched", sessionID, (*int)(nil), (*int)(nil)).
			Return(domain.ErrInternalServerError)

		body := `{"movie_id":10,"action":"watched","grid_session_id":"` + sessionID.String() + `"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/grid/interactions", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.RecordInteraction(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}
