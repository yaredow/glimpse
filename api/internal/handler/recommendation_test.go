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

func (m *mockGridService) RecordInteraction(ctx context.Context, userID, movieID int64, action string, sessionID uuid.UUID, gridPosition, revealActionMs, rating *int) error {
	args := m.Called(ctx, userID, movieID, action, sessionID, gridPosition, revealActionMs, rating)
	return args.Error(0)
}

func (m *mockGridService) SyncGrid(ctx context.Context, userID int64, mood string) ([]domain.GridSlotResponse, int, error) {
	args := m.Called(ctx, userID, mood)
	grid, _ := args.Get(0).([]domain.GridSlotResponse)
	return grid, args.Int(1), args.Error(2)
}

func (m *mockGridService) GetHistory(ctx context.Context, userID int64, action string) ([]domain.HistoryMovie, error) {
	args := m.Called(ctx, userID, action)
	history, _ := args.Get(0).([]domain.HistoryMovie)
	return history, args.Error(1)
}

func (m *mockGridService) DealersChoice(ctx context.Context, userID int64) (*domain.GridSlotResponse, []domain.GridSlotResponse, int, error) {
	args := m.Called(ctx, userID)
	chosen, _ := args.Get(0).(*domain.GridSlotResponse)
	grid, _ := args.Get(1).([]domain.GridSlotResponse)
	return chosen, grid, args.Int(2), args.Error(3)
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

		mockSvc.On("RecordInteraction", mock.Anything, int64(1), int64(10), "revealed", sessionID, mock.Anything, (*int)(nil), (*int)(nil)).
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

	t.Run("watched with rating", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)
		sessionID := uuid.New()

		mockSvc.On(
			"RecordInteraction",
			mock.Anything,
			int64(1),
			int64(10),
			"watched",
			sessionID,
			(*int)(nil),
			(*int)(nil),
			mock.MatchedBy(func(rating *int) bool { return rating != nil && *rating == 5 }),
		).Return(nil)

		body := `{"movie_id":10,"action":"watched","grid_session_id":"` + sessionID.String() + `","rating":5}`
		req := httptest.NewRequest(http.MethodPost, "/v1/grid/interactions", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.RecordInteraction(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("rating outside watched action", func(t *testing.T) {
		t.Parallel()

		_, h, e := newRecHandlerTest(t)
		sessionID := uuid.New()

		body := `{"movie_id":10,"action":"revealed","grid_session_id":"` + sessionID.String() + `","rating":5}`
		req := httptest.NewRequest(http.MethodPost, "/v1/grid/interactions", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.RecordInteraction(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
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

		mockSvc.On("RecordInteraction", mock.Anything, int64(1), int64(10), "watched", sessionID, (*int)(nil), (*int)(nil), (*int)(nil)).
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

// ─── SyncGrid ─────────────────────────────────────────────────────────────

func TestRecommendationHandler_SyncGrid(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		sessionID := uuid.New()
		grid := []domain.GridSlotResponse{
			{MovieID: 20, TmdbID: 200, SlotNumber: 1, IsRevealed: false, VagueDescription: "desc2", Genres: []string{"Drama"}, GridSessionID: sessionID},
		}

		mockSvc.On("SyncGrid", mock.Anything, int64(1), "").Return(grid, 2, nil)

		req := httptest.NewRequest(http.MethodPost, "/v1/grid/sync", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.SyncGrid(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp struct {
			Grid           []domain.GridSlotResponse `json:"grid"`
			SyncsRemaining int                       `json:"syncs_remaining"`
		}
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.Len(t, resp.Grid, 1)
		require.Equal(t, 2, resp.SyncsRemaining)
		require.Equal(t, int64(20), resp.Grid[0].MovieID)
	})

	t.Run("success with mood", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		sessionID := uuid.New()
		grid := []domain.GridSlotResponse{
			{MovieID: 25, TmdbID: 250, SlotNumber: 1, IsRevealed: false, VagueDescription: "spooky desc", Genres: []string{"Horror"}, GridSessionID: sessionID},
		}

		mockSvc.On("SyncGrid", mock.Anything, int64(1), "spooky").Return(grid, 1, nil)

		body := `{"mood":"spooky"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/grid/sync", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.SyncGrid(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp struct {
			Grid           []domain.GridSlotResponse `json:"grid"`
			SyncsRemaining int                       `json:"syncs_remaining"`
		}
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.Len(t, resp.Grid, 1)
		require.Equal(t, 1, resp.SyncsRemaining)
		require.Equal(t, int64(25), resp.Grid[0].MovieID)
	})

	t.Run("no syncs remaining", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		mockSvc.On("SyncGrid", mock.Anything, int64(1), "").Return(nil, 0, domain.ErrNoSyncsRemaining)

		req := httptest.NewRequest(http.MethodPost, "/v1/grid/sync", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.SyncGrid(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusConflict, rec.Code)
	})

	t.Run("selection locked", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		mockSvc.On("SyncGrid", mock.Anything, int64(1), "").Return(nil, 0, domain.ErrSelectionLocked)

		req := httptest.NewRequest(http.MethodPost, "/v1/grid/sync", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.SyncGrid(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusConflict, rec.Code)
	})
}

func TestRecommendationHandler_GetHistory(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		history := []domain.HistoryMovie{
			{
				MovieID: 42,
				Action:  "watched",
				Title:   "Inception",
			},
		}

		mockSvc.On("GetHistory", mock.Anything, int64(1), "watched").Return(history, nil)

		req := httptest.NewRequest(http.MethodGet, "/v1/me/history?action=watched", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.GetHistory(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp struct {
			History []domain.HistoryMovie `json:"history"`
		}
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.Len(t, resp.History, 1)
		require.Equal(t, "Inception", resp.History[0].Title)
	})
}

// ─── DealersChoice ────────────────────────────────────────────────────────

func TestRecommendationHandler_DealersChoice(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		action := domain.ActionPickTonight
		chosen := &domain.GridSlotResponse{
			MovieID:    101,
			SlotNumber: 2,
			Title:      "Interstellar",
			Action:     &action,
		}
		grid := []domain.GridSlotResponse{*chosen}

		mockSvc.On("DealersChoice", mock.Anything, int64(1)).Return(chosen, grid, 3, nil)

		req := httptest.NewRequest(http.MethodPost, "/v1/grid/dealers-choice", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.DealersChoice(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp struct {
			Movie               domain.GridSlotResponse   `json:"movie"`
			Grid                []domain.GridSlotResponse `json:"grid"`
			RemainingCandidates int                       `json:"remaining_candidates"`
		}
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.Equal(t, int64(101), resp.Movie.MovieID)
		require.Equal(t, "Interstellar", resp.Movie.Title)
		require.Equal(t, 3, resp.RemainingCandidates)
		require.Len(t, resp.Grid, 1)
	})

	t.Run("no eligible candidates returns 422", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		mockSvc.On("DealersChoice", mock.Anything, int64(1)).Return(nil, nil, 0, domain.ErrNoEligibleCandidates)

		req := httptest.NewRequest(http.MethodPost, "/v1/grid/dealers-choice", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.DealersChoice(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("selection locked returns 409", func(t *testing.T) {
		t.Parallel()

		mockSvc, h, e := newRecHandlerTest(t)

		mockSvc.On("DealersChoice", mock.Anything, int64(1)).Return(nil, nil, 0, domain.ErrSelectionLocked)

		req := httptest.NewRequest(http.MethodPost, "/v1/grid/dealers-choice", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user", &domain.User{ID: 1})

		err := h.DealersChoice(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusConflict, rec.Code)
	})
}
