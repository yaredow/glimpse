# Glimpse

Stop scrolling. Start watching.

Glimpse is a personalized movie recommendation service built to eliminate decision fatigue. Instead of endless scrolling through recommendation algorithms, Glimpse learns your taste and serves you a curated daily selection—something worth your time, not just something that fits an algorithm.

## The Problem

Movie discovery is broken. Streaming services throw thousands of options at you, recommendation algorithms get stuck in filter bubbles, and you end up spending more time choosing than watching. Glimpse flips this: a lightweight, intelligent engine that actually learns what you like and presents only the best matches each day.

## How It Works

Every action matters. Watch, skip, add to your list—each one teaches Glimpse a little more about what you actually like. The daily picks get better as it learns you, and you'll always know why a movie landed on your plate.

## Tech Stack

**App** (React Native)
- Expo SDK 55 with React Native 0.83
- Expo Router for file-based navigation
- React Query for server state
- React Hook Form for form handling
- React Native Paper for UI
- Zod for validation

**API** (Go backend)
- Go with PostgreSQL
- TMDB API integration for movie data
- Deterministic scoring engine with immutable interaction history

## Getting Started

**API Setup**
```bash
cd api
make docker/up      # Start PostgreSQL
make db/migration/up  # Run migrations
make run/api        # Start the server with live reload
```

**App Setup**
```bash
cd app
bun install
bun start
```

---

Glimpse exists because I got tired of spending 30 minutes deciding what to watch.
