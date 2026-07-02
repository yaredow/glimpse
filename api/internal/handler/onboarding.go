package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/handler/middleware"
	"github.com/yaredow/glimpse-api/internal/tmdb"
	"gopkg.in/go-playground/validator.v9"
)

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

type genreLister interface {
	ListAllGenres(ctx context.Context) ([]domain.Genre, error)
}

type preferenceUpserter interface {
	Upsert(ctx context.Context, p *domain.Preference) error
}

type onboarder interface {
	UpdateOnboarded(ctx context.Context, userID string, onboarded bool) error
}

type OnboardingHandler struct {
	genreLister genreLister
	prefSvc     preferenceUpserter
	onboarder   onboarder
}

func NewOnboardingHandler(e *echo.Echo, genreLister genreLister, prefSvc preferenceUpserter, onboarder onboarder) *OnboardingHandler {
	h := &OnboardingHandler{genreLister: genreLister, prefSvc: prefSvc, onboarder: onboarder}
	e.POST("/v1/onboarding/start", h.Start, middleware.RequireAuthenticatedUser())
	e.POST("/v1/onboarding/finish", h.Complete, middleware.RequireAuthenticatedUser())
	return h
}

func (oh *OnboardingHandler) Start(c *echo.Context) error {
	genres, err := oh.genreLister.ListAllGenres(c.Request().Context())
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{
		"genres":    genres,
		"languages": tmdb.CuratedLanguages,
		"eras":      eraPresets(),
	})
}

func (oh *OnboardingHandler) Complete(c *echo.Context) error {
	var input struct {
		FavoriteGenres []int    `json:"favorite_genres"`
		ExcludedGenres []int    `json:"excluded_genres"`
		Languages      []string `json:"languages"`
		MinRating      float64  `json:"min_rating" validate:"min=0,max=10"`
		MinYear        int      `json:"min_year" validate:"min=1888"`
		MaxYear        int      `json:"max_year" validate:"max=2100"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	user := c.Get("user").(*domain.User)

	p := &domain.Preference{
		UserID:         user.ID,
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      input.MinRating,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
	}

	if err := oh.prefSvc.Upsert(c.Request().Context(), p); err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	if err := oh.onboarder.UpdateOnboarded(c.Request().Context(), strconv.FormatInt(user.ID, 10), true); err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{"preferences": p})
}
