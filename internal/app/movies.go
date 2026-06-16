package app

import (
	"math/rand"
	"net/http"
	"sort"

	"github.com/yaredow/glimpse-api/internal/store/queries"
)

func popularityFloat64(m queries.Movie) float64 {
	if !m.Popularity.Valid {
		return 0
	}
	v, _ := m.Popularity.Float64Value()
	return v.Float64
}

func pickStratified(movies []queries.Movie, n int) []queries.Movie {
	if len(movies) <= n {
		return movies
	}

	sort.Slice(movies, func(i, j int) bool {
		return popularityFloat64(movies[i]) > popularityFloat64(movies[j])
	})

	picked := make([]queries.Movie, 0, n)
	bucketSize := len(movies) / n

	for i := 0; i < n; i++ {
		start := i * bucketSize
		end := start + bucketSize
		if i == n-1 {
			end = len(movies)
		}
		idx := rand.Intn(end - start)
		picked = append(picked, movies[start+idx])
	}

	return picked
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

	movies, err := app.store.GetFilteredMoviesFromPrefs(r.Context(), user.ID, prefs, 200)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	if len(movies) < 5 {
		_ = app.writeJSON(w, http.StatusOK, Envelope{"error": "not enough movies matching your preferences"}, nil)
		return
	}

	picked := pickStratified(movies, 5)
	movieIDs := make([]int64, len(picked))
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
