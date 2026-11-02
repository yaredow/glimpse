package handler

import (
	"context"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
	"gopkg.in/go-playground/validator.v9"
)

type GridService interface {
	GenerateGrid(ctx context.Context, userID int64) ([]domain.GridSlotResponse, uuid.UUID, error)
	RecordInteraction(ctx context.Context, userID, movieID int64, action string, sessionID uuid.UUID, gridPosition, revealActionMs, rating *int) error
	SyncGrid(ctx context.Context, userID int64, mood string) ([]domain.GridSlotResponse, int, error)
	GetHistory(ctx context.Context, userID int64, action string) ([]domain.HistoryMovie, error)
}

type RecommendationHandler struct {
	svc GridService
}

func NewRecommendationHandler(svc GridService) *RecommendationHandler {
	return &RecommendationHandler{svc: svc}
}

func (rh *RecommendationHandler) GetGrid(c *echo.Context) error {
	user := c.Get("user").(*domain.User)

	grid, _, err := rh.svc.GenerateGrid(c.Request().Context(), user.ID)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{"grid": grid})
}

func (rh *RecommendationHandler) RecordInteraction(c *echo.Context) error {
	user := c.Get("user").(*domain.User)

	var input struct {
		MovieID        int64     `json:"movie_id" validate:"required"`
		Action         string    `json:"action" validate:"required"`
		GridSessionID  uuid.UUID `json:"grid_session_id" validate:"required"`
		GridPosition   *int      `json:"grid_position"`
		RevealActionMs *int      `json:"reveal_action_ms"`
		Rating         *int      `json:"rating" validate:"omitempty,min=1,max=5"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, ResponseError{Message: err.Error()})
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, ResponseError{Message: err.Error()})
	}

	if input.Rating != nil && input.Action != string(domain.ActionWatched) {
		return c.JSON(http.StatusBadRequest, ResponseError{Message: "rating is only allowed for watched interactions"})
	}

	err := rh.svc.RecordInteraction(c.Request().Context(), user.ID, input.MovieID, input.Action, input.GridSessionID, input.GridPosition, input.RevealActionMs, input.Rating)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{"message": "interaction recorded"})
}

func (rh *RecommendationHandler) SyncGrid(c *echo.Context) error {
	user := c.Get("user").(*domain.User)

	var input struct {
		Mood string `json:"mood"`
	}
	if c.Request().Body != nil && c.Request().ContentLength != 0 {
		if err := c.Bind(&input); err != nil {
			return c.JSON(http.StatusBadRequest, ResponseError{Message: "invalid request body"})
		}
	}

	grid, syncsRemaining, err := rh.svc.SyncGrid(c.Request().Context(), user.ID, input.Mood)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{
		"grid":            grid,
		"syncs_remaining": syncsRemaining,
	})
}

func (rh *RecommendationHandler) GetHistory(c *echo.Context) error {
	user := c.Get("user").(*domain.User)
	action := c.QueryParam("action")

	history, err := rh.svc.GetHistory(c.Request().Context(), user.ID, action)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{"history": history})
}
