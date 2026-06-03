package app

import (
	"net/http"
)

func (app *application) GetPopularMovies(w http.ResponseWriter, r *http.Request) {
	movies, err := app.tmdb.GetMovies(r.Context(), 1)
	if err != nil {
		app.logger.Error("failed to fetch popular movies", "error", err)
		app.errorResponse(w, r, http.StatusInternalServerError, "failed to fetch popular movies")
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"movies": movies}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}
}
