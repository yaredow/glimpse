# Glimpse — Backend Reference

## What This App Does

This is a REST API for a mobile app designed to tackle a very common problem: decision fatigue when trying to pick a movie to watch. With thousands of movies available across multiple platforms, most people fall into a rabbit hole of searching for the perfect movie, spend too much time doing so, and end up abandoning the idea altogether.
The goal of this app is to gamify the process of finding a movie to watch by deliberately restricting choice. When a user opens the app, they are presented with a grid of five movies. The poster and title of each movie are hidden, and a short vague description is shown as the only clue. The user picks a movie blindly based solely on that description, then reveals the poster and title to decide if it interests them.
After revealing a movie, the user can mark it as watched, add it to their watchlist, or skip it. Skips are limited to three per day. If the user dislikes the entire set of five movies without revealing any, they can sync to fetch a fresh set — also limited to three times per day. Both limits reset daily.

The app does not have a search bar or browsing. Movies are served to the user, not chosen by them. This constraint is intentional — the entire point is to remove the burden of choice.

## Tech Stack

- **Language:** Go
- **Router:** chi
- **Database:** PostgreSQL via `pgx` and `pgxpool`
- **Query generation:** sqlc
- **External API:** TMDB — synced via a background job, never called in the request path
- **Architecture:** `cmd/api/main.go` is thin (wires config and dependencies only). All application logic lives in `internal/app`.

---

## Project Structure

```
cmd/api/
    main.go

internal/
    app/
        app.go               -- App struct and constructor
        errors.go
        health.go
        helpers.go
        middleware.go
        movies.go            -- movie and grid handlers
        refreshtoken.go
        routes.go
        server.go
        token.go
        users.go
    data/
        queries/             -- sqlc-generated Go code
        sql/                 -- raw .sql query files (sqlc input)
        tmdb/                -- TMDB client (client.go, movies.go)
        token.go
        users.go
    db/
        migrate.go
        pool.go
    validator/
        validator.go

migrations/
vendor/
```

---

## Auth

Complete. JWT access tokens (stateless) + stateful refresh tokens for rotation. All auth and user endpoints are done.

---

## Database Tables

### Completed

- `users`
- `tokens`
- `refresh_tokens`
- `movies` — synced from TMDB, includes pre-reveal fields (`vague_description`, `genres`) and post-reveal fields (`title`, `full_synopsis`, `poster_path`, etc.)

---

## MVP Endpoints (movie/grid only)

| Method | Endpoint                | Purpose                                      |
| ------ | ----------------------- | -------------------------------------------- |
| GET    | `/v1/grid/today`        | Return today's grid — cached or generated    |
| POST   | `/v1/grid/sync`         | Regenerate grid with a fresh set (max 3/day) |
| GET    | `/v1/movies/:id`        | Reveal — return full movie details           |
| POST   | `/v1/movies/:id/action` | Record skip / watchlist / watched + rating   |
| GET    | `/v1/watchlist`         | User's watchlist                             |

**Daily limits** — both capped at 3/day, tracked in `user_grids`, return `429` when exhausted:

- Skips (per movie after reveal)
- Syncs (full grid refresh)

---

## TMDB

- Client lives in `internal/data/tmdb/`
- Configured via `TMDB_API_KEY` env var (Bearer token, not query param)
- Base URL: `https://api.themoviedb.org/3`
- `poster_path` from TMDB is a partial path — full image URL: `https://image.tmdb.org/t/p/w500{poster_path}`

---

## Recommendation Logic (MVP)

- Filter by genre using GIN index on `genres[]`
- Exclude already watched or skipped movies
- Order by `popularity DESC`, pick 5 randomly from top N
- User actions (skips, ratings) are recorded as signals for future improvement

---

## What's Not in MVP

- Stats endpoint
- Watched history endpoint
- Mood tag on sync
- Full recommendation engine
