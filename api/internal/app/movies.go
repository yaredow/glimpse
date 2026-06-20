package app

import (
	"net/http"

	"github.com/yaredow/glimpse-api/internal/store/queries"
)

type gridMovieResponse struct {
	MovieID          int64    `json:"movie_id"`
	TmdbID           int32    `json:"tmdb_id"`
	SlotNumber       int32    `json:"slot_number"`
	IsRevealed       bool     `json:"is_revealed"`
	VagueDescription string   `json:"vague_description"`
	Genres           []string `json:"genres"`
}

func newGridMovieResponse(row queries.GetUserGridRow) gridMovieResponse {
	return gridMovieResponse{
		MovieID:          row.MovieID,
		TmdbID:           row.TmdbID,
		SlotNumber:       row.SlotNumber,
		IsRevealed:       row.IsRevealed,
		VagueDescription: row.VagueDescription,
		Genres:           row.Genres,
	}
}

func (app *application) getTodayGridHandler(w http.ResponseWriter, r *http.Request) {
	user := app.contextGetUser(r)

	grid, sessionID, err := app.recService.GenerateGrid(r.Context(), user.ID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	userDailGrid := make([]gridMovieResponse, len(grid))
	for i, row := range grid {
		userDailGrid[i] = newGridMovieResponse(row)
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"grid": userDailGrid, "session_id": sessionID}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
