package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type ActionWeight struct {
	Delta             float64
	AffectExploration bool
}

type ActionType string

const (
	ActionRevealed     ActionType = "revealed"
	ActionWatched      ActionType = "watched"
	ActionSkipped      ActionType = "skipped"
	ActionWatchlistAdd ActionType = "watchlist_add"
	ActionPickTonight  ActionType = "pick_tonight"
	ActionLockedIn     ActionType = "locked_in"
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

type HistoryMovie struct {
	MovieID          int64           `json:"movie_id"`
	Action           string          `json:"action"`
	ActedAt          time.Time       `json:"acted_at"`
	Title            string          `json:"title"`
	PosterPath       *string         `json:"poster_path,omitempty"`
	BackdropPath     *string         `json:"backdrop_path,omitempty"`
	Genres           []string        `json:"genres"`
	ReleaseDate      time.Time       `json:"release_date"`
	VoteAverage      float64         `json:"vote_average"`
	Runtime          *int            `json:"runtime,omitempty"`
	VagueDescription string          `json:"vague_description"`
	FullSynopsis     *string         `json:"full_synopsis,omitempty"`
	Tagline          *string         `json:"tagline,omitempty"`
	Director         *string         `json:"director,omitempty"`
	CastMembers      json.RawMessage `json:"cast_members,omitempty"`
	TrailerKey       *string         `json:"trailer_key,omitempty"`
}
