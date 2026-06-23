package recusecase

import (
	"fmt"
	"math"

	"github.com/yaredow/glimpse-api/internal/entity"
)

func MovieDimensions(genres []string, language string, releaseYear int32, voteAvg float64) []entity.Dimension {
	dims := []entity.Dimension{
		{Name: "language", Value: language},
		{Name: "decade", Value: decadeOf(releaseYear)},
		{Name: "rating_band", Value: ratingBand(voteAvg)},
	}

	for _, genre := range genres {
		dims = append(dims, entity.Dimension{Name: "genre", Value: genre})
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
	return fmt.Sprintf("%.1f-%.1f", floor, floor+1)
}
