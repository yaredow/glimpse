# Glimpse Recommendation Engine — Final Design

## Sources

This document synthesizes the best approaches from four recommendation engine designs:

| Source      | Key Ideas Adopted                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude**  | Gaussian noise exploration (not epsilon-greedy), genre-level multi-dimension affinities, nightly `score *= 0.97` decay, action deltas (+2.0/-0.5), candidate SQL prefilter, cold start at +1.0, dimension weights |
| **ChatGPT** | Philosophy of explainability, interaction log as source of truth, onboarding answers as priors not filters, future extensibility                                                                                  |
| **Gemini**  | Structured exploitation/exploration balance, cold start seeding of preferred genres                                                                                                                               |
| **Grok**    | Project structure, implementation ordering, edge case awareness                                                                                                                                                   |

---

## Philosophy

Glimpse is not a search engine. It's a blind-choice discovery experience: 5 mysterious movies every day, tap to reveal, then watch, skip, or save. Every interaction teaches the engine. The system should:

1. Learn from every interaction (reveal, watch, skip, watchlist)
2. Discover hidden tastes — not just confirm existing ones
3. Avoid repetitive recommendations with freshness and diversity
4. Be simple enough for a solo developer (pure Go + PostgreSQL, no ML libs)
5. Be explainable — for any recommendation, you can answer "why this movie?"

---

## Architecture

```
┌─────────────┐     GET /v1/grid/today         POST /v1/interactions
│  Mobile App  │─────────────────┐                              │
└──────────────┘                 ▼                              ▼
                        ┌─────────────────┐     ┌──────────────────────────┐
                        │  Grid Handler    │     │  Interaction Handler      │
                        │  recService.     │     │  recService.              │
                        │  GenerateGrid()  │     │  RecordInteraction()      │
                        └────────┬────────┘     └───────────┬──────────────┘
                                 │ read                     │ write
                                 ▼                           ▼
                        ┌─────────────────────────────────────────────┐
                        │  PostgreSQL                                   │
                        │  movies | user_affinities | user_interactions │
                        │  daily_pools | user_grid_history               │
                        └─────────────────────────────────────────────┘
                                 ▲                           ▲
                                 │ every 6h                   │ nightly
                        ┌─────────────┐              ┌──────────────────┐
                        │ TMDB Sync    │              │ Affinity Decay     │
                        │ Worker       │              │ (score *= 0.97)    │
                        └─────────────┘              └──────────────────┘
```

Three tables for the recommendation engine (`user_interactions`, `user_affinities`, `user_grid_history`), plus `daily_pools` for the current day's grid. Two endpoints (`GET /v1/grid/today`, `POST /v1/interactions`), one background job (nightly decay).

---

## Database Schema

### `user_interactions` — Append-only interaction log

```sql
CREATE TYPE action_type AS ENUM (
    'revealed', 'watched', 'skipped', 'watchlist_add'
);

CREATE TABLE user_interactions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id            BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    action              action_type NOT NULL,
    grid_session_id     UUID NOT NULL,
    grid_position       INT,
    reveal_to_action_ms INT,
    acted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The interaction log is the source of truth. Everything else can be rebuilt from it.

### `user_affinities` — Learned taste profile

```sql
CREATE TABLE user_affinities (
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dimension     TEXT NOT NULL,       -- 'genre' | 'language' | 'decade' | 'rating_band'
    value         TEXT NOT NULL,       -- 'Action' | 'en' | '2020s' | '7.0-8.0'
    score         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    confidence    DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, dimension, value)
);
```

A materialized view of taste optimized for fast reads at grid-generation time.

### `user_grid_history` — What was shown when (for freshness scoring)

```sql
CREATE TABLE user_grid_history (
    id        BIGSERIAL PRIMARY KEY,
    user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id  BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    shown_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `daily_pools` — Current day's grid slots

```sql
CREATE TABLE daily_pools (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
    movie_id     BIGINT REFERENCES movies(id) ON DELETE CASCADE,
    slot_number  INT NOT NULL,           -- 1 to 5
    is_revealed  BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, slot_number)
);
```

### `users` — Added columns

```sql
ALTER TABLE users ADD COLUMN exploration_rate     DOUBLE PRECISION NOT NULL DEFAULT 0.4;
ALTER TABLE users ADD COLUMN total_interactions    INT NOT NULL DEFAULT 0;
```

### `movies` — Added columns

```sql
ALTER TABLE movies ADD COLUMN shown_count    INT NOT NULL DEFAULT 0;
ALTER TABLE movies ADD COLUMN watched_count  INT NOT NULL DEFAULT 0;
ALTER TABLE movies ADD COLUMN global_watch_rate DOUBLE PRECISION GENERATED ALWAYS AS (
    CASE WHEN shown_count = 0 THEN 0 ELSE watched_count::double precision / shown_count END
) STORED;
```

---

## Scoring Algorithm

### Movie Score

```
score(movie) = Σ affinity(genre)          for each genre on the movie
             + affinity(language)          for the movie's original language
             + affinity(decade)            for the movie's release decade
             + affinity(rating_band)       for the movie's vote average band
             + 0.10 × ln(1 + popularity)
             + freshness_bonus             (0.10 if unseen, min(days/14, 1)×0.10 if seen)
             + gaussian_noise              rand.NormFloat64() × exploration_rate × 2.0
```

No explicit dimension weights — affinity scores naturally diverge per user, so genre affinity ends up dominating for heavy genre-watchers without artificial crowding.

### Exploration Rate

```
exploration_rate(n) = max(0.05, 0.4 × exp(-n / 50))
noise = rand.NormFloat64() × exploration_rate × 2.0
```

| Interactions | exploration_rate | noise std-dev |
| ------------ | ---------------- | ------------- |
| 0            | 0.40             | ~0.80         |
| 50           | ~0.15            | ~0.30         |
| 200          | ~0.05            | ~0.10         |

Gaussian noise (not epsilon-greedy) avoids hard random-pick boundaries. Every movie gets some noise, but the effect shrinks as the user accumulates interactions. This is a simpler stand-in for Thompson Sampling.

### Freshness Bonus

- Never shown: `freshness = 0.10`
- Shown recently: `freshness = min(days_since_shown / 14, 1.0) × 0.10`
- 14-day half-life — a movie shown yesterday gets ~0.007, one shown 14+ days ago gets full 0.10

---

## Affinities

### Dimensions

| Dimension   | Value Example | Extraction                                                                 |
| ----------- | ------------- | -------------------------------------------------------------------------- |
| genre       | Action        | movie.genres (text[], stored as names not IDs)                             |
| language    | en            | movie.original_language                                                    |
| decade      | 2020s         | movie.release_date → `decadeOf(year)` → `fmt.Sprintf("%ds", (year/10)*10)` |
| rating_band | 7.0-8.0       | movie.vote_average → `ratingBand(voteAvg)` → `"8.0+"` or `"floor-floor+1"` |

Genres are stored as names (text), not TMDB IDs, to keep the system independent of TMDB's genre taxonomy.

### Action Weights

| Action        | Delta | Affects Exploration | Rationale                        |
| ------------- | ----- | ------------------- | -------------------------------- |
| watched       | +2.0  | yes                 | Strongest positive signal        |
| watchlist_add | +1.5  | yes                 | Strong intent, not yet confirmed |
| revealed      | +0.3  | no                  | Curiosity, not commitment        |
| skipped       | -0.5  | yes                 | Negative, but noisy              |

When a user acts on a movie, the delta is applied to **every** dimension that movie carries. A movie tagged Action + Thriller that gets watched updates both `genre:Action` and `genre:Thriller` by +2.0.

"Affects Exploration" means the user's `total_interactions` goes up, which lowers their `exploration_rate`. Reveals don't count — only intentional actions do.

### Upsert Logic

```sql
INSERT INTO user_affinities (user_id, dimension, value, score, confidence, last_updated)
VALUES ($1, $2, $3, $4, 1, NOW())
ON CONFLICT (user_id, dimension, value) DO UPDATE SET
    score      = user_affinities.score + excluded.score,
    confidence = user_affinities.confidence + 1,
    last_updated = NOW();
```

Simple additive update. No dampening, no EMA — the nightly decay handles score compression.

### Score Inflation

A heavy user who's watched 100 action movies accumulates `genre:Action` score ≈ 200, drowning every other signal. The nightly decay (`score *= 0.97`) naturally compresses this. Without it, scores would grow unbounded.

---

## Diversity Enforcement

After scoring and sorting candidates, the top 5 are checked:

1. Copy top 5 into `picked`
2. Check if all 5 share at least one genre with the first movie
3. If they do and there are more candidates available, swap the lowest-scored pick with the first candidate from a different genre

This prevents the grid from being 5/5 action movies even when the user clearly prefers action.

---

## Candidate Prefilter (SQL)

```sql
SELECT m.* FROM movies m
WHERE m.id NOT IN (
    SELECT movie_id FROM user_interactions
    WHERE user_interactions.user_id = $1 AND action IN ('watched', 'skipped')
) AND (
    EXISTS (
        SELECT 1 FROM user_affinities a
        WHERE a.user_id = $1 AND a.dimension = 'genre'
          AND a.value = ANY(m.genres) AND a.score > 0
    )
    OR NOT EXISTS (SELECT 1 FROM user_affinities WHERE user_id = $1)
)
ORDER BY m.popularity DESC
LIMIT $2;
```

Filters out movies the user has already acted on (watched/skipped). Falls back to all movies (ordered by popularity) when the user has no affinities yet (cold start). With a catalog of ~2,000 movies, this prefilter keeps scoring fast.

---

## Cold Start

On onboarding completion:

1. Parse the user's preferred genres from their preference picker
2. Convert TMDB genre IDs to genre names
3. Insert initial affinity rows at **+1.0** for each preferred genre
4. This seeds the scoring so early grids reflect stated preferences

Initial seeding at +1.0 ensures two `watched` actions (+2.0 each) can override a wrong initial guess. Stated preferences → behavior should diverge; behavior wins fast.

---

## Nightly Decay

```sql
UPDATE user_affinities SET score = score * 0.97;
```

- ~30-day half-life on signal strength
- Prevents unbounded score growth
- Old behavior fades, recent behavior dominates
- Tracks drifting taste without explicit "forget" logic

---

## GenerateGrid Flow

```
GenerateGrid(ctx, userID) → (grid, sessionID, error)

├── Check existing grid (repo.GetUserGrid for today)
│   └── If exists → return early (idempotent, sessionID = uuid.Nil)
│
├── Fetch affinities (repo.GetUserAffinities)
├── Fetch candidates (repo.GetCandidateMovies, prefilter SQL)
├── Fetch recently shown (repo.GetRecentlyShownMovies, last 50)
│
├── ScoreMovies(candidates, affinities, freshness_map, totalInteractions)
│   ├── buildAffinityMap()           → map["genre:Action"] = 2.1
│   ├── explorationRateFor(n)        → max(0.05, 0.4 × exp(-n/50))
│   ├── movieScore() for each        → sum of affinities + popularity + freshness + noise
│   └── sort descending by score
│
├── enforceDiversity(scored)         → swap if all 5 same genre
├── Generate new UUID (sessionID)
│
├── repo.Transaction
│   ├── ClearUserGrid                → DELETE FROM daily_pools
│   ├── InsertGridSlot × 5           → slots 1-5 (UserID, MovieID, SlotNumber)
│   └── InsertGridHistory × 5        → log what was shown
│
├── Re-fetch grid (repo.GetUserGrid)
└── Return (grid, sessionID)
```

---

## RecordInteraction Flow (planned)

```
RecordInteraction(ctx, userID, movieID, action, sessionID, position, revealMs) → error

├── Look up movie → extract dimensions (MovieDimensions)
│   ├── genre:       [Action, Thriller, ...]
│   ├── language:    en
│   ├── decade:      2020s
│   └── rating_band: 7.0-8.0
│
├── Get delta from ActionWeights[action]
│
├── Transaction
│   ├── UpsertUserAffinity × N     → each dimension gets score + delta
│   ├── InsertInteraction          → log raw event
│   ├── Update user                → total_interactions++, recompute exploration_rate
│   └── Update movie               → shown_count++ / watched_count++
│
└── Return nil
```

---

## SeedFromOnboarding Flow (planned)

```
SeedFromOnboarding(ctx, userID, preferredGenreIDs) → error

├── Convert genre IDs → names (via genreNames func)
├── For each genre name:
│   └── UpsertUserAffinity(userID, "genre", name, +1.0)
│
└── Return nil
```

---

## API Endpoints

### `GET /v1/grid/today`

Returns the user's 5-movie grid for today. Idempotent — same grid all day.

```json
{
  "grid": [
    {
      "slot_number": 1,
      "is_revealed": false,
      "movie_id": 8,
      "tmdb_id": 454639,
      "vague_description": "After being separated for 15 years...",
      "genres": ["Action", "Fantasy", "Science Fiction"]
    },
    { "...": "..." }
  ],
  "session_id": "6f34e0eb-bdf5-4d22-8159-cda50f5caf12"
}
```

### `POST /v1/interactions` (planned)

```json
{
  "movie_id": 550,
  "action": "watched",
  "grid_session_id": "6f34e0eb-bdf5-4d22-8159-cda50f5caf12",
  "grid_position": 0,
  "reveal_to_action_ms": 4200
}
```

### `GET /v1/debug/taste` (planned, dev only)

Returns the user's top affinity rows for debugging "why was this recommended?"

---

## Go Package Layout (pgx + Echo, no sqlc)

Follows existing clean architecture: handler → service → repository → domain.

```
internal/
  domain/
    recommendation.go    — MovieDimensions, ActionWeight, ActionWeights map, GridSlot, GridResponse
  repository/postgres/
    recommendation.go    — Raw pgx queries (GetUserGrid, GetUserAffinities, GetCandidateMovies,
                           GetRecentlyShown, UpsertUserAffinity, InsertInteraction, etc.)
    recommendation_test.go
  service/
    recommendation.go    — RecommendationService: GenerateGrid, RecordInteraction,
                           SeedFromOnboarding, DecayAffinities. Pure business logic.
    scorer.go            — ScoreMovies, movieScore, enforceDiversity, explorationRateFor, helpers.
                           Package service, reusable from RecommendationService.
    recommendation_test.go
  handler/
    grid.go              — GridHandler: GET /v1/grid/today
    interaction.go       — InteractionHandler: POST /v1/interactions
    debug.go             — DebugHandler: GET /v1/debug/taste (dev only)
```

All DB access goes through `repository/postgres` package using raw pgx (no sqlc).
Scoring and business logic lives in `service` package.
Handlers in `handler` package talk to services via interfaces, matching existing project patterns.

---

## Edge Cases & Gotchas

**Score inflation.** Nightly decay (`score *= 0.97`) prevents unbounded growth. A heavy user's accumulated +200 score naturally compresses.

**Skip ambiguity.** A skip could mean "not my taste" or "already seen it" or "not in the mood." The -0.5 delta (vs +2.0 for watched) reflects this — penalize gently, reward strongly.

**Position bias.** Position 0 in the grid gets disproportionate reveals. `grid_position` is logged but intentionally not used in scoring yet — debias later once the effect can be measured.

**Cold start over-trusting onboarding.** Seed at +1.0, not higher. Two `watched` actions (+2.0 each) can override a wrong initial guess.

**Resurfacing skipped content.** With 2,000 movies, burying a skip indefinitely is fine. If catalog growth stalls, add resurface logic later.

**Exploration noise is per-request, not per-movie-pool.** Don't filter exploration picks — let Gaussian noise reshuffle the full scored list. The prefilter already keeps it from going totally off-taste.

**Concurrency.** Use transactions for affinity updates to prevent race conditions.

**Score explainability.** For any movie, you can decompose its score: genre + language + decade + rating + popularity + freshness + noise. This makes the system debuggable.

---

## Implementation Status

### Not Started (building from scratch in this branch)

- Domain types: MovieDimensions, ActionWeight/ActionWeights, GridSlot, GridResponse
- Migrations: user_interactions, user_affinities, user_grid_history, daily_pools, ALTER TABLE users + movies
- Raw pgx queries (no sqlc): all repo methods in `repository/postgres/recommendation.go`
- Recommendation service + scorer in `service/` package
- Handler endpoints in `handler/` package
- TMDB sync worker (planned, separate PR)
- Nightly decay job (planned, separate PR)

### Build Order

1. Domain types → Migrations → Repository → Service + Scorer → Handler endpoints
