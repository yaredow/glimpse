package domain

import (
	"time"

	"github.com/google/uuid"
)

type GridSlot struct {
	ID            int64     `json:"id"`
	UserID        int64     `json:"-"`
	MovieID       int64     `json:"-"`
	SlotNumber    int       `json:"slot_number"`
	IsRevealed    bool      `json:"is_revealed"`
	GridSessionID uuid.UUID `json:"grid_session_id"`
	AssignedAt    time.Time `json:"assigned_at"`
	Movie         *Movie    `json:"movie,omitempty"`
}

type GridHistory struct {
	ID      int64     `json:"id"`
	UserID  int64     `json:"-"`
	MovieID int64     `json:"movie_id"`
	ShownAt time.Time `json:"shown_at"`
}

type Grid struct {
	SessionID uuid.UUID  `json:"session_id"`
	Slots     []GridSlot `json:"slots"`
}
