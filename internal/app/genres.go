package app

import (
	"net/http"
)

func (app *application) listGenresHandler(w http.ResponseWriter, r *http.Request) {
	genres, err := app.store.ListGenres(r.Context())
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"genres": genres}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
