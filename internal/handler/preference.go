package handler

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/handler/middleware"
	"gopkg.in/go-playground/validator.v9"
)

type PreferenceService interface {
	GetByUserID(ctx context.Context, userID int64) (*domain.Preference, error)
	Upsert(ctx context.Context, preference *domain.Preference) error
}

type PreferenceHandler struct {
	svc PreferenceService
}

func NewPreferenceHandler(e *echo.Echo, svc PreferenceService) *PreferenceHandler {
	h := &PreferenceHandler{svc: svc}
	e.GET("/v1/me/preferences", h.GetPreference, middleware.RequireAuthenticatedUser())
	e.PUT("/v1/me/preferences", h.UpsertPreference, middleware.RequireAuthenticatedUser())
	return h
}

func (h *PreferenceHandler) GetPreference(c *echo.Context) error {
	user := c.Get("user").(*domain.User)

	p, err := h.svc.GetByUserID(c.Request().Context(), user.ID)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{"preference": p})
}

func (h *PreferenceHandler) UpsertPreference(c *echo.Context) error {
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

	if err := h.svc.Upsert(c.Request().Context(), p); err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{"preference": p})
}
