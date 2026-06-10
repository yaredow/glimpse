package app

import (
	"math/rand"
	"net/http"
)

func (app *application) GetPopularMovies(w http.ResponseWriter, r *http.Request) {
	movies, err := app.tmdb.GetMovies(r.Context(), 1)
	if err != nil {
		app.logger.Error("failed to fetch popular movies", "error", err)
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"movies": movies}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}
}

func (app *application) getTodayGridHandler(w http.ResponseWriter, r *http.Request) {
	user := app.contextGetUser(r)

	grid, err := app.store.GetUserGrid(r.Context(), user.ID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	if len(grid) > 0 {
		err = app.writeJSON(w, http.StatusOK, Envelope{"grid": grid}, nil)
		if err != nil {
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	prefs, err := app.store.GetUserPreference(r.Context(), user.ID)
	if err != nil {
		_ = app.writeJSON(w, http.StatusOK, Envelope{"error": "complete onboarding first"}, nil)
		return
	}

	movies, err := app.store.GetFilteredMoviesFromPrefs(r.Context(), user.ID, prefs, 50)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	if len(movies) < 5 {
		_ = app.writeJSON(w, http.StatusOK, Envelope{"error": "not enough movies matching your preferences"}, nil)
		return
	}

	rand.Shuffle(len(movies), func(i, j int) {
		movies[i], movies[j] = movies[j], movies[i]
	})

	picked := movies[:5]
	movieIDs := make([]int64, 5)
	for i, m := range picked {
		movieIDs[i] = m.ID
	}

	if err = app.store.CreateUserGrid(r.Context(), user.ID, movieIDs); err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	grid, err = app.store.GetUserGrid(r.Context(), user.ID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"grid": grid}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
