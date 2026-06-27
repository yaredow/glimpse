package handler

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
	"gopkg.in/go-playground/validator.v9"
)

type ResponseError struct {
	Message string `json:"error"`
}

//go:generate mockery --name UserService --dir . --output mocks --outpkg mocks
type UserService interface {
	Create(ctx context.Context, user *domain.User) error
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
}

type UserHandler struct {
	svc UserService
}

func NewUserHandler(e *echo.Echo, svc UserService) *UserHandler {
	h := &UserHandler{svc: svc}
	e.POST("/v1/users", h.Create)
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
