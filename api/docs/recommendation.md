# Recommendation Engine — Implementation Plan

Based on master's `internal/usecase/recommendation/`, adapted to our service-layer architecture.

## Step 1: Domain Types + Errors

**Files:** `internal/domain/dimension.go`, update `internal/domain/errors.go`, update `internal/domain/interaction.go`, update `internal/domain/grid.go`

### `dimension.go`
```go
type Dimension struct {
    Name  string `json:"name"`
    Value string `json:"value"`
}
```

### Add to `errors.go`
```go
ErrNotEnoughCandidates  = errors.New("not enough movies matching preferences")
ErrInvalidAction        = errors.New("invalid action")
ErrMissingGridSessionID = errors.New("existing grid is missing grid session id")
```

### Add to `interaction.go`
```go
type ActionWeight struct {
    Delta             float64
    AffectExploration bool
}
```

### Update `grid.go` — DTO types for API responses
```go
type GridSlotResponse struct {
    MovieID          int64    `json:"movie_id"`
    TmdbID           int      `json:"tmdb_id"`
    SlotNumber       int      `json:"slot_number"`
    IsRevealed       bool     `json:"is_revealed"`
    VagueDescription string   `json:"vague_description"`
    Genres           []string `json:"genres"`
    GridSessionID    uuid.UUID `json:"grid_session_id"`
}

type GridHistoryEntry struct {
    MovieID int64     `json:"movie_id"`
    ShownAt time.Time `json:"shown_at"`
}
```

---

## Step 2: Grid Repository

**File:** `internal/repository/postgres/grid.go`

`GridRepository` struct with `db *DB`.

### Methods
- `GetUserGrid(ctx, userID int64) ([]GridSlotDTO, error)` — SELECT daily_pools JOIN movies, return slots unrevealed+revealed (all for today). If no rows, return empty slice.
- `Clear(ctx, userID int64) error` — `DELETE FROM daily_pools WHERE user_id = $1`
- `InsertSlot(ctx, userID int64, movieID int64, slotNumber int, sessionID uuid.UUID) error` — `INSERT INTO daily_pools (user_id, movie_id, slot_number, grid_session_id)`

---

## Step 3: Grid History Repository

**File:** `internal/repository/postgres/grid_history.go`

`GridHistoryRepository` struct with `db *DB`.

### Methods
- `GetRecentlyShown(ctx, userID int64, limit int) ([]domain.GridHistoryEntry, error)` — `SELECT movie_id, shown_at FROM user_grid_history WHERE user_id = $1 ORDER BY shown_at DESC LIMIT $2`
- `Insert(ctx, userID int64, movieID int64) error` — `INSERT INTO user_grid_history (user_id, movie_id)`
- `CleanupOld(ctx) error` — `DELETE FROM user_grid_history WHERE shown_at < NOW() - INTERVAL '30 days'`

---

## Step 4: Interaction Repository

**File:** `internal/repository/postgres/interaction.go`

`InteractionRepository` struct with `db *DB`.

### Methods
- `Insert(ctx, *domain.Interaction) error` — INSERT all interaction fields
- `ListByUser(ctx, userID int64, limit int) ([]domain.Interaction, error)` — for future scoring refinement

---

## Step 5: Affinity Repository

**File:** `internal/repository/postgres/affinity.go`

`AffinityRepository` struct with `db *DB`.

### Methods
- `GetByUser(ctx, userID int64) ([]domain.Affinity, error)` — `SELECT user_id, dimension, value, score, confidence, last_updated WHERE user_id = $1`
- `Upsert(ctx, userID int64, dimension, value string, delta float64) error` — `INSERT ON CONFLICT (user_id, dimension, value) DO UPDATE SET score = user_affinities.score + $5`
- `Decay(ctx) error` — `UPDATE user_affinities SET score = score * 0.95 WHERE score != 0`

---

## Step 6: Movie Repository additions

**File:** `internal/repository/postgres/movie.go` (existing)

### Add methods
- `GetByID(ctx, movieID int64) (*domain.Movie, error)` — `SELECT * FROM movies WHERE id = $1`
- `GetCandidateMovies(ctx, userID int64, limit int) ([]*domain.Movie, error)` — prefilter SQL: exclude recently shown, exclude excluded genres, filter by user preference languages, year range, min_rating, order by popularity DESC, LIMIT
- `UpdateWatchCounts(ctx, movieID int64, shown, watched bool) error` — atomic UPDATE on shown_count/watched_count

---

## Step 7: Genre Repository

**File:** `internal/repository/postgres/genre.go` (or merge into `movie.go`)

`GenreRepository` struct with `db *DB`.

### Methods
- `List(ctx) ([]domain.Genre, error)` — moves from `MovieRepository.ListAllGenres`
- `GetNamesByIDs(ctx, ids []int) ([]string, error)` — `SELECT name FROM genres WHERE id = ANY($1)`

---

## Step 8: User Repository additions

**File:** `internal/repository/postgres/user.go` (existing)

### Add method
- `UpdateInteractionStats(ctx, userID int64) error` — `UPDATE users SET total_interactions = total_interactions + 1, exploration_rate = GREATEST(0.05, 0.4 * exp(-(total_interactions + 1)::float / 50)) WHERE id = $1`

---

## Step 9: Scorer Service (pure functions)

**File:** `internal/service/scorer.go`

No struct, no deps — just exported functions.

### Types
```go
type ScoredMovie struct {
    Movie *domain.Movie
    Score float64
}
var ActionWeights = map[string]domain.ActionWeight{...}
```

### Functions
- `ScoreMovies(candidates []*domain.Movie, affinities []domain.Affinity, recentlyShown map[int64]time.Time, totalInteractions int) []ScoredMovie`
  - Call `buildAffinityMap` to get `map[string]float64`
  - Call `explorationRateFor` to get exploration rate
  - Score each candidate via `movieScore`
  - Sort descending by score
- `movieScore(m, affinities, recentlyShown, explorationRate) float64` — genre + language + decade + rating_band + popularity + freshness + noise
- `enforceDiversity(scored []ScoredMovie) []ScoredMovie` — swap slot 5 if all same genre
- `explorationRateFor(totalInteractions int) float64` — `max(0.05, 0.4 * exp(-n/50))`
- `decadeOf(year int) string` — `2020s`, `2010s`, etc.
- `ratingBand(rating float64) string` — `8.0+`, `7.0-8.0`, etc.
- `MovieDimensions(genres, language, year, voteAvg) []domain.Dimension`
- `getActionWeight(action string) (domain.ActionWeight, bool)`

---

## Step 10: Recommendation Service (orchestration)

**File:** `internal/service/recommendation.go`

`RecommendationService` struct with all repo interfaces inline + `*postgres.DB` for transactions.

### Inline interfaces (from port.go)
- `MovieRepository`: `GetByID`, `GetCandidateMovies`, `UpdateWatchCounts`
- `AffinityRepository`: `GetByUser`, `Upsert`
- `GridRepository`: `GetUserGrid`, `Clear`, `InsertSlot`
- `GridHistoryRepository`: `GetRecentlyShown`, `Insert`
- `InteractionRepository`: `Insert`
- `UserRepository`: `UpdateInteractionStats`
- `GenreRepository`: `GetNamesByIDs`

### Methods

**`GenerateGrid(ctx, userID int64) ([]domain.GridSlotResponse, uuid.UUID, error)`**
1. Check `grid.GetUserGrid` — if exists, return early (idempotent)
2. Fetch affinities, candidate movies (200), recently shown (50)
3. Fetch user (for TotalInteractions)
4. `ScoreMovies` → `enforceDiversity` → pick top 5
5. Generate session UUID
6. `db.ExecTx`: Clear grid, InsertSlot × 5, Insert grid history × 5
7. Re-fetch grid, return

**`RecordInteraction(ctx, userID, movieID int64, action string, sessionID uuid.UUID, gridPosition *int, revealActionMs *int) error`**
1. Validate action via `getActionWeight`
2. Fetch movie (for dimensions)
3. Extract dimensions via `MovieDimensions`
4. `db.ExecTx`: Upsert affinity per dimension, Insert interaction, UpdateInteractionStats, UpdateWatchCounts

**`SeedFromOnboarding(ctx, userID int64, genreIDs []int) error`**
1. `genreRepo.GetNamesByIDs` → convert IDs to names
2. For each name: `affinityRepo.Upsert(ctx, userID, "genre", name, 1.0)`

---

## Step 11: Handlers

**File:** `internal/handler/recommendation.go` (new)
**File:** `internal/handler/recommendation_test.go`

### Endpoints
- `GET /v1/grid/today` — calls `GenerateGrid`, returns `{grid: [...], session_id: "..."}`
- `POST /v1/interactions` — calls `RecordInteraction`
- `GET /v1/debug/taste` (dev only) — returns affinities for debugging

### Wire in main.go
```go
gridRepo := postgres.NewGridRepository(db)
gridHistRepo := postgres.NewGridHistoryRepository(db)
interactionRepo := postgres.NewInteractionRepository(db)
affinityRepo := postgres.NewAffinityRepository(db)
genreRepo := postgres.NewGenreRepository(db)

recSvc := service.NewRecommendationService(movieRepo, affinityRepo, interactionRepo, gridRepo, gridHistRepo, userRepo, genreRepo, db)
handler.NewRecommendationHandler(e, recSvc, jwtMgr)
```

---

## Step 12: Wire Into Sync Worker

Update `worker.NewWorker` call in main.go to pass real affinityRepo + gridHistRepo instead of `nil`:

```go
syncWorker := worker.NewWorker(movieRepo, movieRepo, affinityRepo, gridHistRepo, tmdbClient, slog.Default())
```

Now the nightly decay loop actually runs `Decay` and `CleanupOld`.

---

## Build Order Summary

| # | What | Files |
|---|------|-------|
| 1 | Domain types + errors | `dimension.go`, `errors.go`, `interaction.go`, `grid.go` |
| 2 | Grid repo | `repository/postgres/grid.go` |
| 3 | Grid history repo | `repository/postgres/grid_history.go` |
| 4 | Interaction repo | `repository/postgres/interaction.go` |
| 5 | Affinity repo | `repository/postgres/affinity.go` |
| 6 | Movie repo additions | `repository/postgres/movie.go` |
| 7 | Genre repo | `repository/postgres/genre.go` |
| 8 | User repo additions | `repository/postgres/user.go` |
| 9 | Scorer service | `service/scorer.go` |
| 10 | Recommendation service | `service/recommendation.go` |
| 11 | Handlers | `handler/recommendation.go`, `handler/recommendation_test.go` |
| 12 | Wire everything | `main.go`, sync worker |
