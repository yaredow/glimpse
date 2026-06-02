# Glimpse — Product & Technical Brief

## Concept

A daily movie discovery app. You're served 5 blurred posters. Pick one by gut feel. It unblurs. You commit, skip, or sync for a new set. No browsing, no infinite scroll, no decision paralysis.

The core mechanic is **deliberate withholding of information** — you choose based on visual instinct before any metadata influences you.

---

## Core Flow

### 1. The Daily Grid

- Home screen shows 5 blurred posters (2×3 or horizontal carousel)
- Backend serves the real poster URL; the client applies the blur (CSS/RN filter)
- No title, rating, year, or any text visible
- Subtle gradient overlay on each card for polish

### 2. Pick & Reveal

- Tap a poster → unblurs with scale + blur transition animation
- Title, year, and logline slide in beneath
- Other 4 cards fade out
- Two actions: **"Watch it"** (adds to watchlist) or **"Nah"** (marks skipped, returns to grid)

### 3. Sync (Refresh)

- Shuffle icon in top-right corner
- Fetches 5 fresh movies from the backend
- Current set is discarded entirely
- Rate-limited: **3 syncs per day** max

### 4. Watched List

- After watching, mark as watched from watchlist
- Moves from "Watchlist" → "Watched" history
- Fields: movie ID, date watched, optional 1-5 star rating
- Scrollable feed with poster thumbnail + date + rating

---

## Supporting Features

### 5. Taste Profile (backend)

- Every swipe, skip, and watched entry is a signal
- Backend learns preferences per genre, director, era, country
- Daily grid biases toward unwatched movies you'll likely enjoy
- Repeatedly skipped movies are excluded from future grids

### 6. Stats

- Movies discovered this month
- Day streak (consecutive days the app was opened)
- Genres explored (pie chart)
- Success rate (% of watched movies rated 4+)

---

## API Endpoints

| Method | Endpoint                    | Purpose                        |
| ------ | --------------------------- | ------------------------------ |
| GET    | `/v1/grid/today`            | Fetch today's 5 movies         |
| POST   | `/v1/grid/sync`             | Fetch a fresh set of 5         |
| POST   | `/v1/grid/:id/action`       | Record skip/watchlist/add      |
| GET    | `/v1/watchlist`             | Paginated watchlist            |
| POST   | `/v1/watchlist/:id/watched` | Mark watched + optional rating |
| GET    | `/v1/watched`               | Watched history                |
| GET    | `/v1/stats`                 | Stats dashboard                |

---

## Why It's Not Generic

- No search bar — you can't browse, you're served
- No infinite scroll — 5 at a time, forced pause
- Blur isn't a gimmick — it's the core mechanic (pick by vibes, not data)
- Sync limit prevents binge-scrolling through the catalogue
- Streak gives a reason to open it daily even when not planning to watch

The principle: **choosing a movie should take less time than watching a trailer.**

---

## Tech Stack

**Backend:**

- Go with httprouter (no need to switch to chi for this scope)
- JWT-based auth (ported from reference project)
- The real complexity is in the recommendation algorithm and daily grid logic, not the router

**Frontend:**

- TypeScript + React Native (Expo)
- ky for HTTP client
- CSS blur filter on poster images

---

## Naming

**Glimpse** — you only get a glimpse before deciding. One word, easy to say, evokes curiosity.

---

## Origin

This project was born as a learning tool for the book _Let's Go Further_ (golang backend). The existing greenlight-app reference project is kept untouched as future reference. Glimpse is a separate, fresh project built around a real product idea rather than following a curriculum.
