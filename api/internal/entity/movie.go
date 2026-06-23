package entity

import "time"

type Movie struct {
	ID                  int64
	TmdbID              int32
	ImdbID              *string
	VagueDescription    string
	Genres              []string
	Title               string
	OriginalTitle       *string
	FullSynopsis        *string
	PosterPath          *string
	BackdropPath        *string
	ReleaseDate         time.Time
	Runtime             *int32
	VoteAverage         float64
	VoteCount           int32
	OriginalLanguage    string
	Popularity          float64
	CreatedAt           time.Time
	ShownCount          int32
	WatchedCount        int32
	GlobalWatchRate     *float64
	Tagline             *string
	Director            *string
	CastMembers         []byte
	TrailerKey          *string
	SpokenLanguages     []string
	ProductionCountries []string
	DetailSyncedAt      *time.Time
}
