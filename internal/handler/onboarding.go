package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/handler/middleware"
	"github.com/yaredow/glimpse-api/internal/tmdb"
)

type genreLister interface {
	ListAllGenres(ctx context.Context) ([]domain.Genre, error)
}

type EraPreset struct {
	Label   string `json:"label"`
	MinYear int    `json:"min_year"`
	MaxYear int    `json:"max_year"`
}

func eraPresets() []EraPreset {
	currentYear := time.Now().Year()
	return []EraPreset{
		{Label: "Modern Hits (2015 – Present)", MinYear: 2015, MaxYear: currentYear},
		{Label: "The New Millennium (2000 – 2014)", MinYear: 2000, MaxYear: 2014},
		{Label: "90s Nostalgia (1990 – 1999)", MinYear: 1990, MaxYear: 1999},
		{Label: "Retro Classics (1970 – 1989)", MinYear: 1970, MaxYear: 1989},
		{Label: "Timeless Cinema (Pre-1970)", MinYear: 1888, MaxYear: 1969},
		{Label: "Everything", MinYear: 1888, MaxYear: currentYear},
	}
}

type OnboardingHandler struct {
	genreLister genreLister
}

func NewOnboardingHandler(e *echo.Echo, genreLister genreLister) *OnboardingHandler {
	h := &OnboardingHandler{genreLister: genreLister}
	e.POST("/v1/onboarding/start", h.Start, middleware.RequireAuthenticatedUser())
	return h
}

func (h *OnboardingHandler) Start(c *echo.Context) error {
	genres, err := h.genreLister.ListAllGenres(c.Request().Context())
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{
		"genres":    genres,
		"languages": tmdb.CuratedLanguages,
		"eras":      eraPresets(),
	})
}
