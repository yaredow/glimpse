package entity

import "time"

type Preference struct {
	UserID         int64
	FavoriteGenres []int32
	ExcludedGenres []int32
	Languages      []string
	MinRating      float64
	Onboarded      bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
	MinYear        int32
	MaxYear        int32
}
