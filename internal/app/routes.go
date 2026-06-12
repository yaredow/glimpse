package app

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog/v3"
)

func (app *application) routes() http.Handler {
	r := chi.NewRouter()

	r.Use(httplog.RequestLogger(app.logger, &httplog.Options{
		Level:         slog.LevelInfo,
		Schema:        app.logFormat,
		RecoverPanics: true,
	}))

	r.Use(middleware.RequestID)

	r.Use(middleware.Recoverer)

	r.Use(app.authenticate)

	r.NotFound(app.notFoundResponse)
	r.MethodNotAllowed(app.methodNotAllowedResponse)

	r.Get("/v1/healthcheck", app.Healthcheck)

	// Users routes
	r.Post("/v1/users/register", app.userRegistrationHandler)
	r.Put("/v1/users/activate", app.activateUserHandler)
	r.Put("/v1/users/password", app.updateUserPasswordHandler)

	// Auth routes
	r.Post("/v1/tokens/login", app.createAuthenticationTokenHandler)
	r.Post("/v1/tokens/refresh", app.refreshTokenHandler)
	r.Post("/v1/tokens/revoke", app.revokeTokenHandler)
	r.Post("/v1/tokens/activate", app.createActivationTokenHandler)
	r.Post("/v1/tokens/password-reset", app.createPasswordResetTokenHandler)

	r.Group(func(r chi.Router) {
		r.Use(app.requireAuthenticatedUser)

		// Movies
		r.Get("/v1/grid/today", app.getTodayGridHandler)
		r.Get("/v1/movies/genres", app.listGenresHandler)

		// Onboarding
		r.Get("/v1/onboarding/start", app.startOnboardingHandler)
		r.Post("/v1/onboarding/finish", app.finishOnboardingHandler)

		// User Preferences
		r.Get("/v1/users/preferences", app.getPreferencesHandler)
		r.Put("/v1/users/preferences", app.updatePreferencesHandler)
	})

	return r
}
