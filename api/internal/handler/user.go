package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/domain"
	"gopkg.in/go-playground/validator.v9"
)

type ResponseError struct {
	Message string `json:"error"`
}

type envelope map[string]any

//go:generate mockery --name UserService --dir . --output mocks --outpkg mocks
type UserService interface {
	Create(ctx context.Context, user *domain.User) error
	Authenticate(ctx context.Context, email, password string) (*domain.User, *domain.RefreshToken, error)
}

type UserHandler struct {
	svc    UserService
	jwtMgr *auth.JWTManager
}

func NewUserHandler(e *echo.Echo, svc UserService, jwtMgr *auth.JWTManager) *UserHandler {
	h := &UserHandler{svc: svc, jwtMgr: jwtMgr}

	e.POST("/v1/users", h.Create)
	e.POST("/v1/login", h.Authenticate)
	return h
}

func (uh *UserHandler) Create(c *echo.Context) error {
	var input struct {
		Name     string `json:"name" validate:"required"`
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=8"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	user := &domain.User{
		Name:  input.Name,
		Email: input.Email,
	}

	user.Password.Set(input.Password)

	if err := uh.svc.Create(c.Request().Context(), user); err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusCreated, user)
}

func (uh *UserHandler) Authenticate(c *echo.Context) error {
	var input struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=8"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	user, refreshToken, err := uh.svc.Authenticate(c.Request().Context(), input.Email, input.Password)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	jwt, jwtExpiry, err := uh.jwtMgr.GenerateToken(user.ID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{
		"access_token": envelope{
			"token":      jwt,
			"expires_at": jwtExpiry.Format(time.RFC3339),
		},
		"refresh_token": refreshToken,
	})
}
