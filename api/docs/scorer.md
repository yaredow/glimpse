# Scorer Service — Implementation Guide

## Purpose

The scorer is a stateless set of pure functions that rank movie candidates for a user's daily grid. It takes raw data (movies, affinities, history) and returns a scored, diversity-enforced top 5.

No struct, no dependencies — just exported functions in `internal/service/scorer.go`.

## Type Mappings (master → ours)

| Master (`entity.*`)                      | Ours (`domain.*`)               | Notes                                                       |
| ---------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `entity.Movie.Genres`                    | `domain.Movie.Genres`           | `[]string` in both — direct port                            |
| `entity.Movie.OriginalLanguage`          | `domain.Movie.OriginalLanguage` | `string` — direct port                                      |
| `entity.Movie.Popularity`                | `domain.Movie.Popularity`       | `float64` — direct port                                     |
| `entity.Movie.VoteAverage`               | `domain.Movie.VoteAverage`      | `float64` — direct port                                     |
| `entity.Movie.ReleaseDate`               | `domain.Movie.ReleaseDate`      | `time.Time` — direct port                                   |
| `entity.Movie.ID`                        | `domain.Movie.ID`               | `int64` — direct port                                       |
| `entity.UserAffinity`                    | `domain.Affinity`               | Both have `Score float64`                                   |
| `entity.UserAffinity.Dimension`          | `domain.Affinity.Dimension`     | `string` — direct port                                      |
| `entity.UserAffinity.Value`              | `domain.Affinity.Value`         | `string` — direct port                                      |
| `entity.Dimension`                       | `domain.Dimension`              | Master has `Name`+`Value`, ours has `Name`+`Values` (typo?) |
| `ActionWeight` (in master's affinity.go) | `domain.ActionWeight`           | Already defined in `domain/interaction.go`                  |
| `ActionWeights` map                      | `domain.ActionWeights`          | Move to domain or keep in service?                          |

## Files to Create

### 1. `internal/service/scorer.go` — all pure functions

No struct, no constructor. Just these items:

#### Types

```go
type ScoredMovie struct {
    Movie *domain.Movie
    Score float64
}
```

`ActionWeights` and `ActionWeight` — where to put them?

Master splits them:

- `ActionWeight` (struct) — already in `internal/domain/interaction.go` as of Step 1
- `ActionWeights` (map) — master puts it in `affinity.go` inside the usecase package. For our architecture, it makes more sense to put it in the scorer (it's scoring data, not domain). It's used by:
  - Scorer (via `getActionWeight`)
  - Recommendation service (to validate actions)
  - Handler (to validate input)

**Decision:** Keep `ActionWeight` struct in domain (already there). Put the `ActionWeights` map and `getActionWeight` in the scorer since that's the primary consumer. The validation service/handler can call `scorer.ValidActions()` or just reference the same map. Simpler: define it once in the scorer, export both map and validator.

#### Functions (in order of dependency)

**Level 1 — pure helpers (no deps)**

1. `decadeOf(year int32) string` — `fmt.Sprintf("%ds", (year/10)*10)`
   - Master: `int32` param, returns `"2020s"`, `"2010s"`, etc.
   - Ours: same, `int32` param (release year)

2. `ratingBand(rating float64) string`
   - `>= 8.0` → `"8.0+"`
   - Else → `"X.X-Y.Y"` (e.g., `"7.0-8.0"`)
   - Ours: same logic

3. `affinityFor(dimension, value string, affinities map[string]float64) float64`
   - Key format: `dimension + ":" + value`
   - Returns `affinities[key]` (0 if missing)

4. `affinitySumForDimension(values []string, dimension string, affinities map[string]float64) float64`
   - Sums `affinityFor(v)` across all values
   - Used for genres (multiple values)

5. `buildAffinityMap(affinities []domain.Affinity) map[string]float64`
   - Iterates affinities, key by `a.Dimension + ":" + a.Value`, value = `a.Score`

6. `explorationRateFor(totalInteractions int) float64`
   - `max(0.05, 0.4 * math.Exp(-float64(totalInteractions) / 50))`
   - Lower interactions → more exploration noise
   - Floor at 0.05

7. `hasCommonGenre(a, b []string) bool`
   - Nested loop check if any genre in `a` exists in `b`

**Level 2 — movie dimensionality**

8. `MovieDimensions(genres []string, language string, year int32, voteAvg float64) []domain.Dimension`
   - Returns: `[{language, lang}, {decade, X}, {rating_band, Y}, {genre, g1}, {genre, g2}, ...]`
   - Note: our `domain.Dimension` has `Values` (plural), master uses `Value` (singular). Need to align.

**Level 3 — score composition**

9. `movieScore(m *domain.Movie, affinities map[string]float64, recentlyShown map[int64]time.Time, explorationRate float64) float64`
   - Components (all additive):
     - `genreAffinity` — sum of `affinityFor("genre", g)` for each genre in `m.Genres`
     - `langAffinity` — `affinityFor("language", m.OriginalLanguage)`
     - `decadeAff` — `affinityFor("decade", decadeOf(m.ReleaseDate.Year))`
     - `ratingAff` — `affinityFor("rating_band", ratingBand(m.VoteAverage))`
     - `popularity` — `0.10 * math.Log1p(m.Popularity)`
     - `freshness` — if recently shown: `min(days_since_shown/14, 1.0) * 0.10`; else: `0.10`
     - `noise` — `rand.NormFloat64() * explorationRate * 2.0`

**Level 4 — orchestration**

10. `ScoreMovies(candidates []*domain.Movie, affinities []domain.Affinity, recentlyShown map[int64]time.Time, totalInteractions int) []ScoredMovie`
    - Build affinity map
    - Calculate exploration rate
    - Score each candidate
    - Sort descending by score
    - Return

11. `enforceDiversity(scored []ScoredMovie) []ScoredMovie`
    - Take top 5
    - If all 5 share at least one genre with the first:
      - Scan `scored[5:]` for a movie with no common genre with the first
      - Swap it into slot 5
    - If less than 5 total, return as-is
    - If no diverse candidate found, keep original top 5

12. `getActionWeight(action string) (ActionWeight, bool)`
    - Lookup in `ActionWeights` map
    - `watched: +2.0`, `watchlist_add: +1.5`, `revealed: +0.3`, `skipped: -0.5`

## Implementation Order

```
1. ActionWeights map + getActionWeight
2. decadeOf, ratingBand
3. affinityFor, affinitySumForDimension, buildAffinityMap
4. explorationRateFor
5. hasCommonGenre
6. MovieDimensions
7. movieScore
8. ScoreMovies
9. enforceDiversity
```

Each function is testable independently. Write tests alongside each batch (pure functions → easy to test).

## Notes

- `domain.Dimension` has `Values` (plural, string) — master uses `Value` (singular, string). Check if this is intentional or a bug. If it's meant to hold one value, rename to `Value`. If it's meant to hold multiple (like multiple genres), keep as `Values`. The `MovieDimensions` function from master returns one value per dimension, so `Values` (plural) seems wrong — it's a single value. We'll need to align.
- Master uses `int32` for years and IDs in some places; our domain uses `int64` and `int`. Use our domain's conventions.
- The master `ratingBand` for mid-range uses `math.Floor(rating)` which can give unexpected values for low ratings. Port as-is for now.
- Master `gridPosition` is `*int`, our domain `Interaction.GridPosition` is `*int` — fine.
- Master `gridSessionID` is `uuid.UUID` from `entity`, ours is `uuid.UUID` from `domain` — fine.
