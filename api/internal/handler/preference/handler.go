package preferencehandler

import (
	"net/http"
	"time"

	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/handler"
	"github.com/yaredow/glimpse-api/internal/repository/tmdb"
	recusecase "github.com/yaredow/glimpse-api/internal/usecase/recommendation"
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

type Handler struct {
	handler.Base
	uc *recusecase.Usecase
}

func New(base handler.Base, uc *recusecase.Usecase) *Handler {
	return &Handler{Base: base, uc: uc}
}

func (h *Handler) StartOnboarding(w http.ResponseWriter, r *http.Request) {
	genres, err := h.uc.ListGenres(r.Context())
	if err != nil {
		h.ServerError(w, r, err)
		return
	}

	h.WriteJSON(w, http.StatusOK, handler.Envelope{
		"genres":    genres,
		"languages": tmdb.CuratedLanguages,
		"eras":      eraPresets(),
	}, nil)
}

func (h *Handler) FinishOnboarding(w http.ResponseWriter, r *http.Request) {
	var input struct {
		FavoriteGenres []int32  `json:"favorite_genres"`
		ExcludedGenres []int32  `json:"excluded_genres"`
		Languages      []string `json:"languages"`
		MinRating      float64  `json:"min_rating"`
		MinYear        int32    `json:"min_year"`
		MaxYear        int32    `json:"max_year"`
	}

	if err := h.ReadJSON(w, r, &input); err != nil {
		h.BadRequest(w, r, err)
		return
	}

	v := entity.NewValidator()
	prefInput := recusecase.UpsertPreferenceInput{
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      input.MinRating,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
	}
	validatePreferenceInput(v, prefInput)

	for _, code := range input.Languages {
		v.Check(tmdb.IsValidLanguage(code), "languages", "invalid language code: "+code)
	}

	if !v.Valid() {
		h.ValidationFailed(w, r, v.Errors)
		return
	}

	user := handler.ContextGetUser(r)
	prefs, err := h.uc.UpsertPreferences(r.Context(), user.ID, prefInput, true)
	if err != nil {
		h.ServerError(w, r, err)
		return
	}

	if err := h.uc.SeedFromOnboarding(r.Context(), user.ID, input.FavoriteGenres); err != nil {
		h.ServerError(w, r, err)
		return
	}

	h.WriteJSON(w, http.StatusOK, handler.Envelope{"preferences": prefs}, nil)
}

func (h *Handler) GetPreferences(w http.ResponseWriter, r *http.Request) {
	user := handler.ContextGetUser(r)

	prefs, err := h.uc.GetPreferences(r.Context(), user.ID)
	if err != nil {
		if err == recusecase.ErrRecordNotFound {
			h.WriteJSON(w, http.StatusOK, handler.Envelope{"preferences": nil}, nil)
			return
		}
		h.ServerError(w, r, err)
		return
	}

	h.WriteJSON(w, http.StatusOK, handler.Envelope{"preferences": prefs}, nil)
}

func (h *Handler) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	var input struct {
		FavoriteGenres []int32  `json:"favorite_genres"`
		ExcludedGenres []int32  `json:"excluded_genres"`
		Languages      []string `json:"languages"`
		MinRating      float64  `json:"min_rating"`
		MinYear        int32    `json:"min_year"`
		MaxYear        int32    `json:"max_year"`
	}

	if err := h.ReadJSON(w, r, &input); err != nil {
		h.BadRequest(w, r, err)
		return
	}

	v := entity.NewValidator()
	prefInput := recusecase.UpsertPreferenceInput{
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      input.MinRating,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
	}
	validatePreferenceInput(v, prefInput)

	for _, code := range input.Languages {
		v.Check(tmdb.IsValidLanguage(code), "languages", "invalid language code: "+code)
	}

	if !v.Valid() {
		h.ValidationFailed(w, r, v.Errors)
		return
	}

	user := handler.ContextGetUser(r)
	prefs, err := h.uc.UpdatePreferences(r.Context(), user.ID, prefInput)
	if err != nil {
		if err == recusecase.ErrRecordNotFound {
			h.NotFound(w, r)
			return
		}
		h.ServerError(w, r, err)
		return
	}

	h.WriteJSON(w, http.StatusOK, handler.Envelope{"preferences": prefs}, nil)
}

func validatePreferenceInput(v *entity.Validator, input recusecase.UpsertPreferenceInput) {
	v.Check(len(input.FavoriteGenres) > 0, "favorite_genres", "must select at least one favorite genre")
	v.Check(len(input.Languages) > 0, "languages", "must select at least one language")
	v.Check(input.MinRating >= 0 && input.MinRating <= 10, "min_rating", "must be between 0 and 10")
	v.Check(input.MinYear >= 1888, "min_year", "must be 1888 or later")
	v.Check(input.MaxYear >= input.MinYear, "max_year", "must not be before min_year")
}
