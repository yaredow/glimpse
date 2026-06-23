package recusecase

import (
	"time"

	"github.com/google/uuid"
)

type GridSlot struct {
	MovieID          int64
	TmdbID           int32
	SlotNumber       int32
	IsRevealed       bool
	VagueDescription string
	Genres           []string
	GridSessionID    uuid.UUID
}

type GridHistoryEntry struct {
	MovieID int64
	ShownAt time.Time
}

type UpsertPreferenceInput struct {
	FavoriteGenres []int32
	ExcludedGenres []int32
	Languages      []string
	MinRating      float64
	MinYear        int32
	MaxYear        int32
}
