package handler

import (
	"context"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type MovieService interface {
	GetByID(ctx context.Context, userID, movieID int64) (*domain.Movie, error)
}

type MovieHandler struct {
	svc MovieService
}

func NewMovieHandler(svc MovieService) *MovieHandler {
	return &MovieHandler{svc: svc}
}

func (mh *MovieHandler) GetMovie(c *echo.Context) error {
	user := c.Get("user").(*domain.User)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, ResponseError{Message: "invalid movie id"})
	}

	movie, err := mh.svc.GetByID(c.Request().Context(), user.ID, id)
	if err != nil {
		return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, envelope{"movie": movie})
}
