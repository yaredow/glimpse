package recommendation

import (
	"fmt"
	"math"
)

type Dimension struct {
	Name  string
	Value string
}

func MovieDimensions(genre []string, language string, releaseYear int32, voteAvg float64) []Dimension {
	dims := []Dimension{
		{Name: "language", Value: language},
		{Name: "decade", Value: decadeOf(releaseYear)},
		{Name: "popularity", Value: ratingBand(voteAvg)},
	}

	for _, genre := range genre {
		dims = append(dims, Dimension{Name: "genre", Value: genre})
	}

	return dims
}

func decadeOf(year int32) string {
	return fmt.Sprintf("%ds", (year/10)*10)
}

func ratingBand(rating float64) string {
	if rating >= 8.0 {
		return "8.0+"
	}

	floor := math.Floor(rating)
	return fmt.Sprintf("%.1f-%.1f", floor, floor+0.1)
}
