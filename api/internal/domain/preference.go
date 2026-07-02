package domain

import "time"

type Preference struct {
	UserID         int64     `json:"-"`
	FavoriteGenres []int     `json:"favorite_genres"`
	ExcludedGenres []int     `json:"excluded_genres"`
	Languages      []string  `json:"languages"`
	MinRating      float64   `json:"min_rating"`
	MinYear        int       `json:"min_year"`
	MaxYear        int       `json:"max_year"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
