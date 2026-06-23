package recommendation

import (
	"math"
	"math/rand/v2"
	"sort"
	"time"

	"github.com/yaredow/glimpse-api/internal/store/queries"
)

type ScoredMovie struct {
	Movie queries.Movie
	Score float64
}

func ScoreMovies(candidates []queries.Movie, affinities []queries.UserAffinity, recentlyShown map[int64]time.Time, totalInteractions int) []ScoredMovie {
	affMap := buildAffinityMap(affinities)
	explorationRate := explorationRateFor(totalInteractions)

	scored := make([]ScoredMovie, len(candidates))
	for i, m := range candidates {
		scored[i] = ScoredMovie{
			Movie: m,
			Score: movieScore(m, affMap, recentlyShown, explorationRate),
		}
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score > scored[j].Score
	})

	return scored
}

func movieScore(m queries.Movie, affinities map[string]float64, recentlyShown map[int64]time.Time, explorationRate float64) float64 {
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

func hasCommonGenre(a, b []string) bool {
	for _, ga := range a {
		for _, gb := range b {
			if ga == gb {
				return true
			}
		}
	}
	return false
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

func buildAffinityMap(affinities []queries.UserAffinity) map[string]float64 {
	m := make(map[string]float64, len(affinities))
	for _, a := range affinities {
		key := a.Dimension + ":" + a.Value
		m[key] = a.Score
	}
	return m
}

func explorationRateFor(totalInteractions int) float64 {
	return math.Max(0.05, 0.4*math.Exp(-float64(totalInteractions)/50))
}
