package domain

import (
	"time"

	"github.com/google/uuid"
)

type ActionType string

const (
	ActionRevealed     ActionType = "revealed"
	ActionWatched      ActionType = "watched"
	ActionSkipped      ActionType = "skipped"
	ActionWatchlistAdd ActionType = "watchlist_add"
)

type Interaction struct {
	ID               int64      `json:"id"`
	UserID           int64      `json:"user_id"`
	MovieID          int64      `json:"movie_id"`
	Action           ActionType `json:"action"`
	GridSessionID    uuid.UUID  `json:"grid_session_id"`
	GridPosition     *int       `json:"grid_position,omitempty"`
	RevealToActionMS *int       `json:"reveal_to_action_ms,omitempty"`
	ActedAt          time.Time  `json:"acted_at"`
}
