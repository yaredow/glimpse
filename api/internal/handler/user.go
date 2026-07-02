package handler

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/mailer"
	"github.com/yaredow/glimpse-api/internal/worker"
	"gopkg.in/go-playground/validator.v9"
)

type ResponseError struct {
	Message string `json:"error"`
}

type envelope map[string]any

//go:generate mockery --name UserService --dir . --output mocks --outpkg mocks
type UserService interface {
	Create(ctx context.Context, user *domain.User) (*domain.Token, error)
	GetByID(ctx context.Context, id int64) (*domain.User, error)
	Authenticate(ctx context.Context, email, password string) (*domain.User, *domain.RefreshToken, error)
	Activate(ctx context.Context, tokenPlainText string) (*domain.User, error)
	RequestPasswordReset(ctx context.Context, email string) (*domain.Token, error)
	ResetPassword(ctx context.Context, tokenPlainText, newPassword string) error
	RotateRefreshToken(ctx context.Context, refreshTokenPlainText string) (*domain.RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, refreshTokenPlainText string) error
}

type UserHandler struct {
	svc     UserService
	jwtMgr  *auth.JWTManager
	mailer  mailer.Mailer
	workers *worker.Pool
}

func NewUserHandler(svc UserService, jwtMgr *auth.JWTManager, mailer mailer.Mailer, workers *worker.Pool) *UserHandler {
	return &UserHandler{svc: svc, jwtMgr: jwtMgr, mailer: mailer, workers: workers}
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

	token, err := uh.svc.Create(c.Request().Context(), user)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	uh.workers.Background(func() {
		err := uh.mailer.Send(user.Email, "user_welcome.html", envelope{
			"userID":          user.ID,
			"activationToken": token.Plaintext,
		})
		if err != nil {
			fmt.Printf("failed to send welcome email: %v\n", err)
		}
	})

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

func (uh *UserHandler) Activate(c *echo.Context) error {
	var input struct {
		TokenPlainText string `json:"token" validate:"required"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	user, err := uh.svc.Activate(c.Request().Context(), input.TokenPlainText)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, user)
}

func (uh *UserHandler) RequestPasswordReset(c *echo.Context) error {
	var input struct {
		Email string `json:"email" validate:"required,email"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	token, err := uh.svc.RequestPasswordReset(c.Request().Context(), input.Email)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	if token != nil {
		uh.workers.Background(func() {
			err := uh.mailer.Send(input.Email, "token_password_reset.html", envelope{
				"passwordResetToken": token.Plaintext,
			})
			if err != nil {
				fmt.Printf("failed to send password reset email: %v\n", err)
			}
		})
	}

	return c.JSON(http.StatusAccepted, envelope{"message": "if the email exists, a reset link has been sent"})
}

func (uh *UserHandler) ResetPassword(c *echo.Context) error {
	var input struct {
		Token       string `json:"token" validate:"required"`
		NewPassword string `json:"newPassword" validate:"required,min=8"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	err := uh.svc.ResetPassword(c.Request().Context(), input.Token, input.NewPassword)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{"message": "password updated successfully"})
}

func (uh *UserHandler) RefreshToken(c *echo.Context) error {
	var input struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	refreshToken, err := uh.svc.RotateRefreshToken(c.Request().Context(), input.RefreshToken)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	jwt, jwtExpiry, err := uh.jwtMgr.GenerateToken(refreshToken.UserID)
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

func (uh *UserHandler) Logout(c *echo.Context) error {
	var input struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	err := uh.svc.RevokeRefreshToken(c.Request().Context(), input.RefreshToken)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.NoContent(http.StatusNoContent)
}
