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

func setupTest(t *testing.T) (*mocks.MockUserService, *echo.Echo) {
	t.Helper()
	mockSvc := mocks.NewMockUserService(t)
	e := echo.New()
	return mockSvc, e
}

func TestUserHandler_Create(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		h := handler.NewUserHandler(e, mockSvc)

		body := `{"name":"John","email":"john@test.com","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/users", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		mockSvc.EXPECT().
			Create(mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
				return u.Name == "John" && u.Email == "john@test.com"
			})).
			Return(nil)

		err := h.Create(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusCreated, rec.Code)

		var resp domain.User
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.Equal(t, "John", resp.Name)
		require.Equal(t, "john@test.com", resp.Email)
	})

	t.Run("invalid request body", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		h := handler.NewUserHandler(e, mockSvc)

		body := `{invalid json`
		req := httptest.NewRequest(http.MethodPost, "/v1/users", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Create(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		h := handler.NewUserHandler(e, mockSvc)

		body := `{"name":"","email":"bad","password":"short"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/users", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Create(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		h := handler.NewUserHandler(e, mockSvc)

		body := `{"name":"John","email":"john@test.com","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/users", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		mockSvc.EXPECT().
			Create(mock.Anything, mock.Anything).
			Return(domain.ErrConflict)

		err := h.Create(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusConflict, rec.Code)
	})
}
