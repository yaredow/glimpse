# Glimpse — Backend Reference

## What This App Does

A REST API for a mobile app that tackles decision fatigue when picking a movie to watch. Instead of browsing, the user is presented with a grid of five hidden movies. Only a short vague description is visible. The user picks blindly, then reveals the poster and title. Skips are limited per day. The constraint is intentional — remove the burden of choice.

## Tech Stack

- **Language:** Go
- **Router:** Echo
- **Database:** PostgreSQL via `pgx` and `pgxpool`
- **External API:** TMDB — synced via a background job, never called in the request path

## Auth

JWT access tokens (stateless) + stateful refresh tokens for rotation.

## Database Tables

- `users`
- `tokens` — scoped tokens (activation, password reset)
- `refresh_tokens`
- `movies`
- `genres`
- `user_preferences`
- `daily_pools`

## TMDB

- Poster path from TMDB is partial — full URL: `https://image.tmdb.org/t/p/w500{poster_path}`

## Recommendation Logic (MVP)

- Filter by genre
- Exclude already watched or skipped movies
- Order by popularity, pick 5 randomly from top N

## What's Not in MVP

- Grid endpoints
- Movie reveal and actions
- Watchlist endpoint
- Daily limit enforcement
- Stats, watched history, mood tag, full recommendation engine
