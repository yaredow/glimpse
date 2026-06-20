package app

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/yaredow/glimpse-api/internal/recommendation"
	"github.com/yaredow/glimpse-api/internal/validator"
)

func (app *application) recordInteractionHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		MovieID        int64  `json:"movie_id"`
		Action         string `json:"action"`
		GridSessionID  string `json:"grid_session_id"`
		GridPosition   *int   `json:"grid_position"`
		RevealActionMs *int   `json:"reveal_action_ms"`
	}

	err := app.ReadJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	v := validator.New()
	recommendation.ValidateInteractionInput(v, input.MovieID, input.Action, input.GridSessionID, input.GridPosition)
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	sessionID, err := uuid.Parse(input.GridSessionID)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user := app.contextGetUser(r)
	err = app.recService.RecordInteraction(r.Context(), user.ID, input.MovieID, input.Action, sessionID, input.GridPosition, input.RevealActionMs)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"message": "interaction recorded"}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
