package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type userGetter interface {
	GetByID(ctx context.Context, id int64) (*domain.User, error)
}

func Authenticate(jwtMgr *auth.JWTManager, userSvc userGetter) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			c.Response().Header().Set("Vary", "Authorization")

			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return next(c)
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.JSON(http.StatusUnauthorized, map[string]any{
					"error": "invalid authorization header",
				})
			}

			userID, err := jwtMgr.ValidateJWTToken(parts[1])
			if err != nil {
				switch {
				case errors.Is(err, auth.ErrInvalidJWTToken), errors.Is(err, auth.ErrExpiredJWTToken):
					return c.JSON(http.StatusUnauthorized, map[string]any{
						"error": "invalid jwt token",
					})
				default:
					return c.JSON(http.StatusInternalServerError, map[string]any{
						"error": "internal server error",
					})
				}
			}

			user, err := userSvc.GetByID(c.Request().Context(), userID)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]any{
					"error": "invalid authentication token",
				})
			}

			c.Set("user", user)
			return next(c)
		}
	}
}

func RequireAuthenticatedUser() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			user := c.Get("user")
			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]any{
					"error": "you must be authenticated to access this resource",
				})
			}

			return next(c)
		}
	}
}
