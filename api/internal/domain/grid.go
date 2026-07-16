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
	GridSessionID    uuid.UUID `json:"grid_session_id"`
}

type GridHistoryEntry struct {
	MovieID int64     `json:"movie_id"`
	ShownAt time.Time `json:"shown_at"`
}
