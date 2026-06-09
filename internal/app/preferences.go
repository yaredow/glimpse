package app

import (
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	"github.com/yaredow/glimpse-api/internal/validator"
)

type EraPreset struct {
	Label   string `json:"label"`
	MinYear int32  `json:"min_year"`
	MaxYear int32  `json:"max_year"`
}

var eraPresets = []EraPreset{
	{Label: "Modern Hits (2015 – Present)", MinYear: 2015, MaxYear: 2026},
	{Label: "The New Millennium (2000 – 2014)", MinYear: 2000, MaxYear: 2014},
	{Label: "90s Nostalgia (1990 – 1999)", MinYear: 1990, MaxYear: 1999},
	{Label: "Retro Classics (1970 – 1989)", MinYear: 1970, MaxYear: 1989},
	{Label: "Timeless Cinema (Pre-1970)", MinYear: 1888, MaxYear: 1969},
	{Label: "Everything", MinYear: 1888, MaxYear: 2026},
}

func (app *application) startOnboardingHandler(w http.ResponseWriter, r *http.Request) {
	genres, err := app.store.ListGenres(r.Context())
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	languages, err := app.tmdb.GetLanguages(r.Context())
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	data := Envelope{
		"genres":    genres,
		"languages": languages,
		"eras":      eraPresets,
	}

	err = app.writeJSON(w, http.StatusOK, data, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) updatePreferencesHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		FavoriteGenres []int32  `json:"favorite_genres"`
		ExcludedGenres []int32  `json:"excluded_genres"`
		Languages      []string `json:"languages"`
		MinRating      float64  `json:"min_rating"`
		MinYear        int32    `json:"min_year"`
		MaxYear        int32    `json:"max_year"`
	}

	err := app.ReadJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user := app.contextGetUser(r)

	v := validator.New()

	v.Check(len(input.Languages) > 0, "languages", "must provide at least one language")
	v.Check(input.MinRating >= 0 && input.MinRating <= 10, "min_rating", "must be between 0 and 10")
	v.Check(input.MinYear >= 1888, "min_year", "must be greater than 1888")
	v.Check(input.MaxYear >= input.MinYear, "max_year", "must be greater than min_year")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	var minRating pgtype.Numeric
	err = minRating.Scan(fmt.Sprintf("%f", input.MinRating))
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	params := queries.UpsertPreferenceParams{
		UserID:         user.ID,
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      minRating,
		Onboarded:      true,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
	}

	prefs, err := app.store.UpsertPreference(r.Context(), params)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"preferences": prefs}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
