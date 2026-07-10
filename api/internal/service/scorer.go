package service

import (
	"fmt"
	"math"
	"math/rand/v2"
	"slices"
	"sort"
	"time"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type ActionWeightsMap map[string]domain.ActionWeight

var ActionWeights = ActionWeightsMap{
	"watched":       {Delta: 2.0, AffectExploration: true},
	"watchlist_add": {Delta: 1.5, AffectExploration: true},
	"revealed":      {Delta: 0.3, AffectExploration: false},
	"skipped":       {Delta: -0.5, AffectExploration: true},
}

func ValidActions() []string {
	keys := make([]string, 0, len(ActionWeights))
	for k := range ActionWeights {
		keys = append(keys, k)
	}

	return keys
}

func getActionWeight(action string) (domain.ActionWeight, bool) {
	w, ok := ActionWeights[action]

	return w, ok
}

func buildAffinityMap(affinities []domain.Affinity) map[string]float64 {
	m := make(map[string]float64, len(affinities))
	for _, a := range affinities {
		key := a.Dimension + ":" + a.Value
		m[key] = a.Score
	}
	return m
}

func affinityFor(dimension, value string, affinities map[string]float64) float64 {
	return affinities[dimension+":"+value]
}

func affinitySumForDimension(values []string, dimension string, affinities map[string]float64) float64 {
	var sum float64
	for _, v := range values {
		sum += affinityFor(dimension, v, affinities)
	}
	return sum
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

type ScoredMovie struct {
	Movie *domain.Movie
	Score float64
}

func hasCommonGenre(a, b []string) bool {
	for _, ga := range a {
		if slices.Contains(b, ga) {
			return true
		}
	}
	return false
}

func MovieDimensions(genres []string, language string, releaseYear int32, voteAvg float64) []domain.Dimension {
	dims := []domain.Dimension{
		{Name: "language", Value: language},
		{Name: "decade", Value: decadeOf(releaseYear)},
		{Name: "rating_band", Value: ratingBand(voteAvg)},
	}

	for _, genre := range genres {
		dims = append(dims, domain.Dimension{Name: "genre", Value: genre})
	}

	return dims
}

func movieScore(m *domain.Movie, affinities map[string]float64, recentlyShown map[int64]time.Time, explorationRate float64) float64 {
	genreAffinity := affinitySumForDimension(m.Genres, "genre", affinities)
	langAffinity := affinityFor("language", m.OriginalLanguage, affinities)

	year := int32(0)
	if !m.ReleaseDate.IsZero() {
		year = int32(m.ReleaseDate.Year())
	}

	decadeAff := affinityFor("decade", decadeOf(year), affinities)
	ratingAff := affinityFor("rating_band", ratingBand(m.VoteAverage), affinities)

	popularity := 0.10 * math.Log1p(m.Popularity)

	freshness := 0.0
	if shownAt, ok := recentlyShown[m.ID]; ok {
		days := time.Since(shownAt).Hours() / 24
		freshness = math.Min(days/14, 1.0) * 0.10
	} else {
		freshness = 0.10
	}

	noise := rand.NormFloat64() * explorationRate * 2.0

	return genreAffinity + langAffinity + decadeAff + ratingAff + popularity + freshness + noise
}

func ScoreMovies(candidates []*domain.Movie, affinities []domain.Affinity, recentlyShown map[int64]time.Time, totalInteractions int) []ScoredMovie {
	affMap := buildAffinityMap(affinities)
	rate := explorationRateFor(totalInteractions)

	scored := make([]ScoredMovie, len(candidates))
	for i, m := range candidates {
		scored[i] = ScoredMovie{
			Movie: m,
			Score: movieScore(m, affMap, recentlyShown, rate),
		}
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score > scored[j].Score
	})

	return scored
}

func enforceDiversity(scored []ScoredMovie) []ScoredMovie {
	if len(scored) < 5 {
		return scored
	}

	picked := make([]ScoredMovie, 5)
	copy(picked, scored[:5])

	firstGenres := picked[0].Movie.Genres
	if len(firstGenres) == 0 {
		return picked
	}

	allSameGenre := true
	for _, sm := range picked[1:] {
		if !hasCommonGenre(firstGenres, sm.Movie.Genres) {
			allSameGenre = false
			break
		}
	}

	if allSameGenre && len(scored) > 5 {
		for _, candidate := range scored[5:] {
			if !hasCommonGenre(firstGenres, candidate.Movie.Genres) {
				picked[4] = candidate
				break
			}
		}
	}

	return picked
}

func explorationRateFor(totalInteractions int) float64 {
	return math.Max(0.05, 0.4*math.Exp(-float64(totalInteractions)/50))
}
