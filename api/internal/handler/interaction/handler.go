package interactionhandler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/handler"
	recusecase "github.com/yaredow/glimpse-api/internal/usecase/recommendation"
)

type Handler struct {
	handler.Base
	uc *recusecase.Usecase
}

func New(base handler.Base, uc *recusecase.Usecase) *Handler {
	return &Handler{Base: base, uc: uc}
}

func (h *Handler) RecordInteraction(w http.ResponseWriter, r *http.Request) {
	var input struct {
		MovieID        int64  `json:"movie_id"`
		Action         string `json:"action"`
		GridSessionID  string `json:"grid_session_id"`
		GridPosition   *int   `json:"grid_position"`
		RevealActionMs *int   `json:"reveal_action_ms"`
	}

	if err := h.ReadJSON(w, r, &input); err != nil {
		h.BadRequest(w, r, err)
		return
	}

	v := entity.NewValidator()
	recusecase.ValidateInteractionInput(v, input.MovieID, input.Action, input.GridSessionID, input.GridPosition)
	if !v.Valid() {
		h.ValidationFailed(w, r, v.Errors)
		return
	}

	sessionID, err := uuid.Parse(input.GridSessionID)
	if err != nil {
		h.BadRequest(w, r, err)
		return
	}

	user := handler.ContextGetUser(r)
	if err := h.uc.RecordInteraction(r.Context(), user.ID, input.MovieID, input.Action, sessionID, input.GridPosition, input.RevealActionMs); err != nil {
		h.ServerError(w, r, err)
		return
	}

	h.WriteJSON(w, http.StatusOK, handler.Envelope{"message": "interaction recorded"}, nil)
}
