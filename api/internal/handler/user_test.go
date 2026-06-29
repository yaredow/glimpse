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

func TestUserHandler_Activate(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		user := &domain.User{ID: 1, Name: "John", Email: "john@test.com", Activated: true}

		mockSvc.EXPECT().
			Activate(mock.Anything, "valid-token").
			Return(user, nil)

		body := `{"tokenPlainText":"valid-token"}`
		req := httptest.NewRequest(http.MethodPut, "/v1/users/activates", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Activate(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp domain.User
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		require.True(t, resp.Activated)
	})

	t.Run("invalid request body", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		body := `{invalid json`
		req := httptest.NewRequest(http.MethodPut, "/v1/users/activates", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Activate(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		body := `{"tokenPlainText":""}`
		req := httptest.NewRequest(http.MethodPut, "/v1/users/activates", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Activate(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		mockSvc.EXPECT().
			Activate(mock.Anything, "expired-token").
			Return(nil, domain.ErrNotFound)

		body := `{"tokenPlainText":"expired-token"}`
		req := httptest.NewRequest(http.MethodPut, "/v1/users/activates", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.Activate(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestUserHandler_RefreshToken(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		refreshToken := &domain.RefreshToken{
			UserID:    1,
			Plaintext: "new-refresh-token-value",
			FamilyID:  "some-uuid",
		}

		mockSvc.EXPECT().
			RotateRefreshToken(mock.Anything, "valid-refresh-token").
			Return(refreshToken, nil)

		body := `{"refresh_token":"valid-refresh-token"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/tokens/refresh", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.RefreshToken(c)
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
		req := httptest.NewRequest(http.MethodPost, "/v1/tokens/refresh", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.RefreshToken(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		body := `{"refresh_token":""}`
		req := httptest.NewRequest(http.MethodPost, "/v1/tokens/refresh", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.RefreshToken(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		mockSvc.EXPECT().
			RotateRefreshToken(mock.Anything, "expired-token").
			Return(nil, domain.ErrNotFound)

		body := `{"refresh_token":"expired-token"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/tokens/refresh", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.RefreshToken(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestUserHandler_RequestPasswordReset(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		mockSvc.EXPECT().
			RequestPasswordReset(mock.Anything, "john@test.com").
			Return(nil)

		body := `{"email":"john@test.com"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/tokens/password-reset", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.RequestPasswordReset(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusAccepted, rec.Code)
	})

	t.Run("invalid request body", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		body := `{invalid json`
		req := httptest.NewRequest(http.MethodPost, "/v1/tokens/password-reset", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.RequestPasswordReset(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		body := `{"email":"bad"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/tokens/password-reset", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.RequestPasswordReset(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		mockSvc.EXPECT().
			RequestPasswordReset(mock.Anything, "john@test.com").
			Return(domain.ErrInternalServerError)

		body := `{"email":"john@test.com"}`
		req := httptest.NewRequest(http.MethodPost, "/v1/tokens/password-reset", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.RequestPasswordReset(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}

func TestUserHandler_ResetPassword(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		mockSvc.EXPECT().
			ResetPassword(mock.Anything, "valid-token", "newpassword123").
			Return(nil)

		body := `{"token":"valid-token","newPassword":"newpassword123"}`
		req := httptest.NewRequest(http.MethodPut, "/v1/users/password", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.ResetPassword(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("invalid request body", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		body := `{invalid json`
		req := httptest.NewRequest(http.MethodPut, "/v1/users/password", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.ResetPassword(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		body := `{"token":"","newPassword":"short"}`
		req := httptest.NewRequest(http.MethodPut, "/v1/users/password", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.ResetPassword(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()

		mockSvc, e := setupTest(t)
		jwtMgr := auth.NewManager([]byte("test-secret"))
		h := handler.NewUserHandler(e, mockSvc, jwtMgr)

		mockSvc.EXPECT().
			ResetPassword(mock.Anything, "bad-token", "newpassword123").
			Return(domain.ErrNotFound)

		body := `{"token":"bad-token","newPassword":"newpassword123"}`
		req := httptest.NewRequest(http.MethodPut, "/v1/users/password", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := h.ResetPassword(c)
		require.NoError(t, err)
		require.Equal(t, http.StatusNotFound, rec.Code)
	})
}
