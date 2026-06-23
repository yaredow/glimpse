// Package middleware
package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/handler"
	userusecase "github.com/yaredow/glimpse-api/internal/usecase/user"
)

type AuthMiddleware struct {
	jwt      *auth.JWTManager
	userRepo userusecase.UserRespository
	base     handler.Base
}

func NewAuth(jwt *auth.JWTManager, userRepo userusecase.UserRespository, base handler.Base) *AuthMiddleware {
	return &AuthMiddleware{
		jwt:      jwt,
		userRepo: userRepo,
		base:     base,
	}
}

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Vary", "Authorization")

		authorizationHeader := r.Header.Get("Authorization")
		if authorizationHeader == "" {
			r = handler.ContextSetUser(r, nil)
			next.ServeHTTP(w, r)
			return
		}

		headerParts := strings.Split(authorizationHeader, " ")
		if len(headerParts) != 2 || headerParts[0] != "Bearer" {
			m.base.InvalidAuthenticationToken(w, r)
			return
		}

		token := headerParts[1]
		userID, err := m.jwt.ValidateJWTToken(token)
		if err != nil {
			switch {
			case errors.Is(err, auth.ErrInvalidJWTToken), errors.Is(err, auth.ErrExpiredToken):
				m.base.InvalidAuthenticationToken(w, r)
			default:
				m.base.ServerError(w, r, err)
			}
			return
		}

		user, err := m.userRepo.GetByID(r.Context(), userID)
		if err != nil {
			if errors.Is(err, userusecase.ErrRecordNotFound) {
				m.base.InvalidAuthenticationToken(w, r)
				return
			}
			m.base.ServerError(w, r, err)
			return
		}

		r = handler.ContextSetUser(r, user)
		next.ServeHTTP(w, r)
	})
}

func (m *AuthMiddleware) RequireAuthenticatedUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := handler.ContextGetUser(r)
		if user == nil {
			m.base.AuthenticationRequired(w, r)
			return
		}
		next.ServeHTTP(w, r)
	})
}
