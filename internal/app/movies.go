package app

import (
	"net/http"
)

func (app *application) getTodayGridHandler(w http.ResponseWriter, r *http.Request) {
	user := app.contextGetUser(r)

	grid, sessionID, err := app.recService.GenerateGrid(r.Context(), user.ID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"grid": grid, "session_id": sessionID}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
