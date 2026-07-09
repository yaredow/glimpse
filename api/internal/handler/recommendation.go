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
	RecordInteraction(ctx context.Context, userID, movieID int64, action string, sessionID uuid.UUID, gridPosition, revealActionMs *int) error
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
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	v := validator.New()
	if err := v.Struct(input); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	err := rh.svc.RecordInteraction(c.Request().Context(), user.ID, input.MovieID, input.Action, input.GridSessionID, input.GridPosition, input.RevealActionMs)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{"message": "interaction recorded"})
}
