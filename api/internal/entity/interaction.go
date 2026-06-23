package entity

import "time"

type ActionType string

const (
	ActionRevealed     ActionType = "revealed"
	ActionWatched      ActionType = "watched"
	ActionSkipped      ActionType = "skipped"
	ActionWatchlistAdd ActionType = "watchlist_add"
)

type Interaction struct {
	ID               int64
	UserID           int64
	MovieID          int64
	Action           ActionType
	GridSessionID    string
	GridPosition     *int
	RevealToActionMs *int
	ActedAt          time.Time
}
