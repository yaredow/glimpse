# Glimpse

Personalized daily movie recommendations designed to cut through decision fatigue. Instead of endless catalogs, it serves a curated 5-card daily grid powered by an explainable, multi-dimensional user affinity engine.

---

## Architecture

- **`api/` (Backend)**: Go, PostgreSQL (`pgx/v5`), Echo v5, TMDB API integration.
  - Multi-dimensional affinity scoring (`genre`, `language`, `decade`, `rating`).
  - Exploration decay with Gaussian noise and diversity enforcement.
  - Append-only immutable interaction log.
- **`app/` (Mobile & Web)**: React Native / Expo with Bun.
  - Expo Router, TanStack Query & Form, React Native Paper.

---

## Development

### 1. Environment Setup

Using **Nix** (reproducible toolchain for Go, Bun, Postgres tools, Air):

```bash
direnv allow
# or manually enter:
nix develop
```

### 2. Run the Backend

```bash
cd api
cp .env.example .env    # Configure TMDB credentials
make docker/up          # Start PostgreSQL container
make db/migration/up    # Run database migrations
air                     # Start API with live-reload (port :4000)
```

### 3. Run the Frontend

```bash
cd app
bun install
bun start               # Start Metro bundler / Expo dev server
```

---

## Production Builds (Nix)

```bash
# Build standalone Go API binary (outputs to ./result/bin/api)
nix build .#api

# Build static web export of the Expo app (outputs to ./result/)
nix build .#app
```
