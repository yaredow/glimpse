package handler

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog/v3"
)

type Routes struct {
	Authenticate          func(http.Handler) http.Handler
	RequireAuthenticatedUser func(http.Handler) http.Handler
	Register              http.HandlerFunc
	Activate              http.HandlerFunc
	UpdatePassword        http.HandlerFunc
	Login                 http.HandlerFunc
	Refresh               http.HandlerFunc
	Revoke                http.HandlerFunc
	CreateActivation      http.HandlerFunc
	CreatePasswordReset   http.HandlerFunc
	GetTodayGrid          http.HandlerFunc
	RecordInteraction     http.HandlerFunc
	StartOnboarding       http.HandlerFunc
	FinishOnboarding      http.HandlerFunc
	GetPreferences        http.HandlerFunc
	UpdatePreferences     http.HandlerFunc
}

func NewRouter(logger *slog.Logger, logFormat *httplog.Schema, rts Routes) http.Handler {
	r := chi.NewRouter()

	r.Use(httplog.RequestLogger(logger, &httplog.Options{
		Level:         slog.LevelInfo,
		Schema:        logFormat,
		RecoverPanics: true,
	}))

	r.Use(chimw.RequestID)
	r.Use(chimw.Recoverer)
	r.Use(rts.Authenticate)

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		b := NewBase(logger)
		b.NotFound(w, r)
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		b := NewBase(logger)
		b.WriteJSON(w, http.StatusMethodNotAllowed, Envelope{
			"error": fmt.Sprintf("The %s method is not supported for this resource", r.Method),
		}, nil)
	})

	r.Post("/v1/users/register", rts.Register)
	r.Put("/v1/users/activate", rts.Activate)
	r.Put("/v1/users/password", rts.UpdatePassword)

	r.Post("/v1/tokens/login", rts.Login)
	r.Post("/v1/tokens/refresh", rts.Refresh)
	r.Post("/v1/tokens/revoke", rts.Revoke)
	r.Post("/v1/tokens/activate", rts.CreateActivation)
	r.Post("/v1/tokens/password-reset", rts.CreatePasswordReset)

	r.Group(func(r chi.Router) {
		r.Use(rts.RequireAuthenticatedUser)

		r.Get("/v1/grid/today", rts.GetTodayGrid)
		r.Post("/v1/interactions", rts.RecordInteraction)

		r.Get("/v1/onboarding/start", rts.StartOnboarding)
		r.Post("/v1/onboarding/finish", rts.FinishOnboarding)

		r.Get("/v1/users/preferences", rts.GetPreferences)
		r.Put("/v1/users/preferences", rts.UpdatePreferences)
	})

	return r
}
