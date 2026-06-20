package app

import (
	"net/http"
	"time"

	"github.com/yaredow/glimpse-api/internal/store"
	"github.com/yaredow/glimpse-api/internal/tmdb"
	"github.com/yaredow/glimpse-api/internal/validator"
)

type EraPreset struct {
	Label   string `json:"label"`
	MinYear int32  `json:"min_year"`
	MaxYear int32  `json:"max_year"`
}

func eraPresets() []EraPreset {
	currentYear := int32(time.Now().Year())
	return []EraPreset{
		{Label: "Modern Hits (2015 – Present)", MinYear: 2015, MaxYear: currentYear},
		{Label: "The New Millennium (2000 – 2014)", MinYear: 2000, MaxYear: 2014},
		{Label: "90s Nostalgia (1990 – 1999)", MinYear: 1990, MaxYear: 1999},
		{Label: "Retro Classics (1970 – 1989)", MinYear: 1970, MaxYear: 1989},
		{Label: "Timeless Cinema (Pre-1970)", MinYear: 1888, MaxYear: 1969},
		{Label: "Everything", MinYear: 1888, MaxYear: currentYear},
	}
}

func (app *application) startOnboardingHandler(w http.ResponseWriter, r *http.Request) {
	genres, err := app.store.ListGenres(r.Context())
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	data := Envelope{
		"genres":    genres,
		"languages": tmdb.CuratedLanguages,
		"eras":      eraPresets(),
	}

	err = app.writeJSON(w, http.StatusOK, data, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) getPreferencesHandler(w http.ResponseWriter, r *http.Request) {
	user := app.contextGetUser(r)

	prefs, err := app.store.GetUserPreference(r.Context(), user.ID)
	if err != nil {
		switch {
		case err == store.ErrRecordNotFound:
			err = app.writeJSON(w, http.StatusOK, Envelope{"preferences": nil}, nil)
			if err != nil {
				app.serverErrorResponse(w, r, err)
			}
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"preferences": prefs}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) finishOnboardingHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		FavoriteGenres []int32  `json:"favorite_genres"`
		ExcludedGenres []int32  `json:"excluded_genres"`
		Languages      []string `json:"languages"`
		MinRating      float64  `json:"min_rating"`
		MinYear        int32    `json:"min_year"`
		MaxYear        int32    `json:"max_year"`
	}

	if err := app.ReadJSON(w, r, &input); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	v := validator.New()
	prefInput := store.UpsertPreferenceInput{
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      input.MinRating,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
	}
	store.ValidatePreferenceInput(v, prefInput)

	for _, code := range input.Languages {
		v.Check(tmdb.IsValidLanguage(code), "languages", "invalid language code: "+code)
	}

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	user := app.contextGetUser(r)
	prefs, err := app.store.UpsertPreference(r.Context(), user.ID, prefInput, true)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	genreIDs := make([]int, len(input.FavoriteGenres))
	for i, id := range input.FavoriteGenres {
		genreIDs[i] = int(id)
	}

	err = app.recService.SeedFromOnboarding(r.Context(), user.ID, genreIDs)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, Envelope{"preferences": prefs}, nil)
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

	if err := app.ReadJSON(w, r, &input); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	v := validator.New()
	prefInput := store.UpsertPreferenceInput{
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      input.MinRating,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
	}
	store.ValidatePreferenceInput(v, prefInput)

	for _, code := range input.Languages {
		v.Check(tmdb.IsValidLanguage(code), "languages", "invalid language code: "+code)
	}

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	user := app.contextGetUser(r)
	prefs, err := app.store.UpdatePreferences(r.Context(), user.ID, prefInput)
	if err != nil {
		switch {
		case err == store.ErrRecordNotFound:
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	app.writeJSON(w, http.StatusOK, Envelope{"preferences": prefs}, nil)
}
