# Recommendation Service — Implementation Plan

## Overview

Orchestrator that ties repositories + scorer together. Three methods:
- `GenerateGrid` — create today's 5-movie grid
- `RecordInteraction` — log an action and update affinities
- `SeedFromOnboarding` — seed affinities when user completes onboarding

## Repo Method Mappings (master vs ours)

| Master name              | Our actual name           | Notes                                |
|--------------------------|---------------------------|--------------------------------------|
| `grid.GetUserGrid`       | `gridRepo.GetByID`        | Takes `userID int64`                 |
| `grid.Clear`             | `gridRepo.Clear`          | Same                                |
| `grid.InsertSlot`        | `gridRepo.Insert`         | Takes `(ctx, userID, movieID, sessionID, slotNumber)` |
| `gridHistory.GetRecentlyShown` | `gridHistRepo.GetRecent` | Takes `(ctx, userID, limit int)`   |
| `gridHistory.Insert`     | `gridHistRepo.Insert`     | Same                                |
| `gridHistory.CleanupOld` | `gridHistRepo.Clean`      | Same                                |
| `affinity.GetByUser`     | `affinityRepo.GetByUserID` | Returns `[]*domain.Affinity`        |
| `affinity.Upsert`        | `affinityRepo.Upsert`     | Takes `(ctx, userID, dimension, value, delta)` |
| `affinity.Decay`         | **Does not exist**        | Skip for now (sync worker concern)  |
| `movie.GetByID`          | `movieRepo.GetByID`       | Same                                |
| `movie.GetCandidateMovies` | `movieRepo.GetCandidateMovies` | Same                            |
| `movie.UpdateWatchCounts` | `movieRepo.UpdateWatchCount` | Takes `(ctx, movieID, shown, watched)` |
| `genre.GetNamesByIDs`    | `genreRepo.GetNamesByID`  | Takes `[]int` (not `[]int32`)       |
| `user.GetByID`           | `userRepo.GetByID`        | Returns `*domain.User`              |
| `user.UpdateInteractionStats` | `userRepo.UpdateInteractionsStat` | Takes `userID string` (not int64) |
| `txManager.RunInTx`      | `db.ExecTx`               | Passes `pgx.Tx` (not `RepositoryProvider`) |

## Key Architecture Decisions

### 1. Transactions

Master uses `RepositoryProvider` to give each callback a tx-aware repo set. We don't have that.

**Options:**

**A. Pass `pgx.Tx` through repo methods** — add a `WithTx(tx pgx.Tx) *Repo` variant to each repo. Clean but verbose.

**B. Use `db.ExecTx` + pass repos inside the callback** — since our repos use `Pool` interface, and `*DB` implements `Pool`, the callback can just call repo methods directly inside `ExecTx`. **Issue:** repos use `db.Pool` which bypasses the transaction.

**C. Store tx on the service instance** — not thread-safe, bad idea.

**Verdict:** Option A — add a `WithTx` method to each repo that returns a new repo instance using the transaction as the pool. Pattern:

```go
type GridRepository struct {
    pool Pool
}

func (gr *GridRepository) WithTx(tx pgx.Tx) *GridRepository {
    return &GridRepository{pool: tx}
}
```

`pgx.Tx` implements `pgx.Rows` query methods, so it satisfies `Pool` interface. This is minimal and thread-safe (each call returns a new struct).

### 2. Interfaces

Define inline interfaces in `internal/service/recommendation.go` matching our actual repo methods. No centralized port file — keep them next to the consumer.

### 3. `TotalInteractions` on User

Master reads `user.TotalInteractions` for the exploration rate. Our `domain.User` doesn't have this field.

**Options:**
- A. Add `TotalInteractions int` to `domain.User` and populate it in `userRepo.GetByID`
- B. Add a separate `GetTotalInteractions` query
- C. Accept it as a separate param in `GenerateGrid`

**Verdict:** Option A — simplest. Add the field, update the `GetByID` SQL query to include it.

## Service Structure

```
internal/service/recommendation.go
  - RecommendationService struct (all repo deps + db)
  - NewRecommendationService(...) constructor
  - GenerateGrid(ctx, userID) -> ([]GridSlotResponse, uuid.UUID, error)
  - RecordInteraction(ctx, userID, movieID, action, sessionID, gridPosition, revealActionMs) -> error
  - SeedFromOnboarding(ctx, userID, genreIDs) -> error

internal/service/recommendation_test.go
```

### `GenerateGrid` Flow

```
1. gridRepo.GetByID(userID) → existing slots
2. if exists and has sessionID → return early (idempotent)
3. if exists but no sessionID → return ErrMissingGridSessionID
4. affinityRepo.GetByUserID(userID) → user affinities
5. movieRepo.GetCandidateMovies(userID, 200) → candidates
6. gridHistRepo.GetRecent(userID, 50) → recently shown
7. userRepo.GetByID(userID) → get TotalInteractions
8. ScoreMovies(candidates, affinities, recentlyShown, totalInteractions) → scored
9. if < 5 candidates → return ErrNotEnoughCandidates
10. enforceDiversity(scored) → pick top 5
11. uuid.New() → sessionID
12. db.ExecTx:
    - gridRepo.WithTx(tx).Clear(userID)
    - gridRepo.WithTx(tx).Insert(userID, movieID, sessionID, slotNumber) × 5
    - gridHistRepo.WithTx(tx).Insert(userID, movieID) × 5
13. gridRepo.GetByID(userID) → re-fetch grid
14. return (grid, sessionID, nil)
```

### `RecordInteraction` Flow

```
1. getActionWeight(action) → validate
2. movieRepo.GetByID(movieID) → get movie + genres
3. MovieDimensions(movie.Genres, language, year, voteAvg) → dims
4. db.ExecTx:
    - for each dim: affinityRepo.WithTx(tx).Upsert(userID, dim.Name, dim.Value, weight.Delta)
    - interactionRepo.WithTx(tx).Insert(interaction)
    - if weight.AffectExploration: userRepo.WithTx(tx).UpdateInteractionsStat(userID)
    - movieRepo.WithTx(tx).UpdateWatchCount(movieID, shown, watched)
```

### `SeedFromOnboarding` Flow

```
1. genreRepo.GetNamesByID(genreIDs) → genre names
2. for each name: affinityRepo.Upsert(userID, "genre", name, 1.0)
```
No transaction needed — this runs during onboarding (single user, non-critical).

## Files to Modify

| File | Change |
|------|--------|
| `internal/service/recommendation.go` | **New** — service struct + 3 methods |
| `internal/service/recommendation_test.go` | **New** — tests |
| `internal/domain/user.go` | Add `TotalInteractions int` field |
| `internal/repository/postgres/user.go` | Update `GetByID` SQL to include `total_interactions` |
| `internal/repository/postgres/grid.go` | Add `WithTx` method |
| `internal/repository/postgres/grid_history.go` | Add `WithTx` method |
| `internal/repository/postgres/interaction.go` | Add `WithTx` method |
| `internal/repository/postgres/affinity.go` | Add `WithTx` method |
| `internal/repository/postgres/movie.go` | Add `WithTx` method |
| `internal/repository/postgres/user.go` | Add `WithTx` method |
| `internal/repository/postgres/genre.go` | Add `WithTx` method |
| `internal/handler/routes/routes.go` | Wire `RecommendationService` when handler is built |

## Build Order

1. Add `WithTx` to each repo + add `TotalInteractions` to `domain.User`
2. Create `recommendation.go` with inline interfaces + service struct + constructor
3. Implement `GenerateGrid`
4. Implement `RecordInteraction`
5. Implement `SeedFromOnboarding`
6. Tests
