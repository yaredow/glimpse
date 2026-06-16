package recommendation

import (
	"math"
	"math/rand/v2"
	"sort"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
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
	if m.ReleaseDate.Valid {
		year = int32(m.ReleaseDate.Time.Year())
	}

	decadeAff := affinityFor("decade", decadeOf(year), affinities)

	ratingAff := affinityFor("rating_band", ratingBand(numericToFloat64(m.VoteAverage)), affinities)

	popularity := 0.10 * math.Log1p(numericToFloat64(m.Popularity))

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

func numericToFloat64(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, err := strconv.ParseFloat(n.Int.String()+"e"+strconv.Itoa(int(n.Exp)), 64)
	if err != nil {
		return 0
	}
	return f
}
