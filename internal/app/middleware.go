package app

import (
	"errors"
	"net/http"
	"strings"

	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/store"
)

func (app *application) requireAuthenticatedUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := app.contextGetUser(r)

		if user.ID == 0 {
			app.authenticationRequiredResponse(w, r)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (app *application) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Vary", "Authorization")

			authorizationHeader := r.Header.Get("Authorization")
			if authorizationHeader == "" {
				r = app.contextSetUser(r, store.AnonymousUser)
				next.ServeHTTP(w, r)
				return
			}

			headerParts := strings.Split(authorizationHeader, " ")
			if len(headerParts) != 2 || headerParts[0] != "Bearer" {
				app.invalidAuthenticationTokenResponse(w, r)
				return
			}

			token := headerParts[1]
			userID, err := app.jwt.ValidateJWTToken(token)
			if err != nil {
				switch {
				case errors.Is(err, auth.ErrInvalidJWTToken), errors.Is(err, auth.ErrExpiredToken):
					app.invalidAuthenticationTokenResponse(w, r)
				default:
					app.serverErrorResponse(w, r, err)
				}
				return
			}

			user, err := app.store.GetUserById(r.Context(), userID)
			if err != nil {
				switch {
				case errors.Is(err, store.ErrRecordNotFound):
					app.invalidAuthenticationTokenResponse(w, r)
				default:
					app.serverErrorResponse(w, r, err)
				}
				return
			}

			r = app.contextSetUser(r, user)

			next.ServeHTTP(w, r)
		},
	)
}
