package domain

import "time"

type Genre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Movie struct {
	ID                  int64     `json:"id"`
	TmdbID              int       `json:"tmdb_id"`
	ImdbID              *string   `json:"imdb_id,omitempty"`
	VagueDescription    string    `json:"vague_description"`
	Genres              []string  `json:"genres"`
	Title               string    `json:"title"`
	OriginalTitle       *string   `json:"original_title,omitempty"`
	FullSynopsis        *string   `json:"full_synopsis,omitempty"`
	PosterPath          *string   `json:"poster_path,omitempty"`
	BackdropPath        *string   `json:"backdrop_path,omitempty"`
	Tagline             *string   `json:"tagline,omitempty"`
	Director            *string   `json:"director,omitempty"`
	CastMembers         []byte    `json:"cast_members,omitempty"`
	TrailerKey          *string   `json:"trailer_key,omitempty"`
	ReleaseDate         time.Time `json:"release_date"`
	Runtime             *int      `json:"runtime,omitempty"`
	VoteAverage         float64   `json:"vote_average"`
	VoteCount           *int      `json:"vote_count,omitempty"`
	OriginalLanguage    string    `json:"original_language"`
	SpokenLanguages     []string  `json:"spoken_languages,omitempty"`
	ProductionCountries []string  `json:"production_countries,omitempty"`
	Popularity          float64   `json:"popularity"`
	ShownCount          int       `json:"-"`
	WatchedCount        int       `json:"-"`
	GlobalWatchRate     float64   `json:"-"`
	DetailSyncedAt      *time.Time `json:"-"`
	Version             int       `json:"-"`
	CreatedAt           time.Time `json:"created_at"`
}
