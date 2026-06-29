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
	"github.com/yaredow/glimpse-api/internal/auth"
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
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

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
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

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
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

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
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

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

func TestUserHandler_Authenticate(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		user := &domain.User{ID: 1, Name: "John", Email: "john@test.com"}
		refreshToken := &domain.RefreshToken{
			Plaintext: "refresh-token-value",
			FamilyID:  "some-uuid",
		}

		mockSvc.EXPECT().
			Authenticate(mock.Anything, "john@test.com", "password123").
			Return(user, refreshToken, nil)

		body := `{"email":"john@test.com","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/authentication", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Authenticate(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]any
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)

		accessToken, ok := resp["access_token"].(map[string]any)
		require.True(t, ok)
		require.NotEmpty(t, accessToken["token"])
		require.NotEmpty(t, accessToken["expires_at"])

		require.Contains(t, resp, "refresh_token")
		require.NotNil(t, resp["refresh_token"])
	})

	t.Run("invalid request body", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		body := `{invalid json`
		req := httptest.NewRequest(http.MethodPost, "/v1/authentication", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Authenticate(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		body := `{"email":"bad","password":"short"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/authentication", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Authenticate(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("invalid credentials", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		mockSvc.EXPECT().
			Authenticate(mock.Anything, "john@test.com", "wrong-password").
			Return(nil, nil, domain.ErrInvalidCredentials)

		body := `{"email":"john@test.com","password":"wrong-password"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/authentication", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Authenticate(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnauthorized, rec.Code)
	})
}
