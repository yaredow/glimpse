package main

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
	r.Use(middleware.Recoverer)

	r.Get("/healthcheck", app.getMoviesHandler)

	// User routes
	r.Post("/v1/users/register", app.createUserHandler)

	return r
}
