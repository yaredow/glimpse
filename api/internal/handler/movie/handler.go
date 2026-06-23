package moviehandler

import (
	"net/http"

	"github.com/yaredow/glimpse-api/internal/handler"
	recusecase "github.com/yaredow/glimpse-api/internal/usecase/recommendation"
)

type gridMovieResponse struct {
	MovieID          int64    `json:"movie_id"`
	TmdbID           int32    `json:"tmdb_id"`
	SlotNumber       int32    `json:"slot_number"`
	IsRevealed       bool     `json:"is_revealed"`
	VagueDescription string   `json:"vague_description"`
	Genres           []string `json:"genres"`
}

type Handler struct {
	handler.Base
	uc *recusecase.Usecase
}

func New(base handler.Base, uc *recusecase.Usecase) *Handler {
	return &Handler{Base: base, uc: uc}
}

func (h *Handler) GetTodayGrid(w http.ResponseWriter, r *http.Request) {
	user := handler.ContextGetUser(r)

	grid, sessionID, err := h.uc.GenerateGrid(r.Context(), user.ID)
	if err != nil {
		h.ServerError(w, r, err)
		return
	}

	items := make([]gridMovieResponse, len(grid))
	for i, slot := range grid {
		items[i] = gridMovieResponse{
			MovieID:          slot.MovieID,
			TmdbID:           slot.TmdbID,
			SlotNumber:       slot.SlotNumber,
			IsRevealed:       slot.IsRevealed,
			VagueDescription: slot.VagueDescription,
			Genres:           slot.Genres,
		}
	}

	h.WriteJSON(w, http.StatusOK, handler.Envelope{"grid": items, "session_id": sessionID}, nil)
}
