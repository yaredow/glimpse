# Glimpse — Monorepo Agent Guide

Personalized movie recommendation platform (React Native mobile app + Go backend) designed to eliminate decision fatigue via a deterministic, explainable taste-learning engine.

## Repository Layout
- [`api/`](file:///home/yada/Documents/code/apps/glimps/api/): Go backend (Echo v5, PostgreSQL, TMDB integration, scoring engine, background workers)
- [`app/`](file:///home/yada/Documents/code/apps/glimps/app/): Mobile client (Expo SDK 57, React Native 0.86, Expo Router, TanStack Query/Form)

---

## Golang Backend (`api/`)

### Quick Start
```bash
cd api
make docker/up          # Spin up PostgreSQL (port 5432)
make db/migration/up    # Apply pending SQL migrations
make run/api            # Start Echo server on :4000 with Air live reload
make audit              # Run go vet, staticcheck, and race-detector tests
make tidy               # Format code, tidy go.mod, and update vendor
```

### Architecture & Key Concepts
- **Stack**: Go 1.26+, Echo v5, `pgx/v5` connection pool, PostgreSQL 16.
- **Layered Boundaries** (enforced by `.go-arch-lint.yml`):
  `handler` -> `service` -> `repository` with common `domain` models.
- **Scoring Engine** (`internal/service/scorer.go`):
  Evaluates candidate movies across 4 affinity dimensions (`genre`, `language`, `decade`, `rating_band`).
  - Action feedback weights: `watched` (+2.0), `watchlist_add` (+1.5), `revealed` (+0.3), `skipped` (-0.5).
  - Controlled decaying Gaussian noise prevents filter bubbles while preserving explainability.
  - Enforces genre diversity across the 9 daily recommendation slots.
- **Workers** (`internal/worker/`): Background pool syncing movie metadata and details from TMDB.
- **Testing**: Tests located alongside code (`*_test.go`) using `testify`, `pgxmock`, and generated `mockery` interfaces.

---

## Mobile App (`app/`)

### Quick Start
```bash
cd app
bun install
bun start        # Expo dev server
bun run android  # Android emulator (uses 10.0.2.2:4000 default)
bun run ios      # iOS simulator (use localhost:4000)
bun run lint     # ESLint flat config
```

### Architecture & Key Concepts
- **Stack**: Expo SDK 57, React Native 0.86, React 19, Expo Router (typed routes), React Compiler enabled.
- **Routing Groups** (`app/`):
  - `(auth)`: Login, registration, token activation
  - `(onboarding)`: 5-step taste setup (favorite genres, disliked genres, era, language, rating threshold)
  - `(app)/(tabs)`: Daily 3x3 movie grid (`index`), watched history (`watched`), user settings (`profile`)
  - `(app)/movies/[id]`: Movie details modal
- **State & Data**:
  - `Zustand`: Token management & auth persistence via `expo-secure-store`.
  - `TanStack Query`: Server state with automatic JWT renewal interceptor (`lib/api.ts`).
  - `TanStack Form` + `Zod`: Form management and validation schemas.
- **Styling**: React Native Paper 5 with custom MD3 dark Netflix palette (`lib/colors.ts`).
- **Path Alias**: `@/` maps to `app/`.

---

## Cross-Cutting & Environment
- **Auth Flow**: Backend issues short-lived JWT access tokens + stored refresh tokens. The mobile app automatically intercepts 401s and refreshes tokens via `lib/api.ts`.
- **Emulator Networking**: Android emulators connect to backend via `http://10.0.2.2:4000`. iOS simulators use `http://localhost:4000`. Set via `EXPO_PUBLIC_API_URL` in `app/.env`.
- **Known Quirk**: `app/features/movies/consants/` directory name is misspelled (`consants` instead of `constants`).
