package domain

import (
	"time"

	"github.com/google/uuid"
)

type GridSlotResponse struct {
	MovieID          int64     `json:"movie_id"`
	TmdbID           int       `json:"tmdb_id"`
	SlotNumber       int       `json:"slot_number"`
	IsRevealed       bool      `json:"is_revealed"`
	VagueDescription string    `json:"vague_description"`
	Tagline          *string   `json:"tagline,omitempty"`
	Genres           []string  `json:"genres"`
	Title            string    `json:"title"`
	PosterPath       *string   `json:"poster_path,omitempty"`
	BackdropPath     *string   `json:"backdrop_path,omitempty"`
	VoteAverage      float64   `json:"vote_average"`
	ReleaseDate      time.Time `json:"release_date"`
	GridSessionID    uuid.UUID `json:"grid_session_id"`
}

type GridHistoryEntry struct {
	MovieID int64     `json:"movie_id"`
	ShownAt time.Time `json:"shown_at"`
}
