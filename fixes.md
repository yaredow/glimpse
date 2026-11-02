# Glimpse — Fix List

> Single source of truth for defects, risks, and cleanup. Ordered highest → lowest priority.
>
> **Status:** `[ ]` open · `[~]` in progress · `[x]` done
> **Priority:** **P0** = demo blocker / data integrity · **P1** = before the interview · **P2** = next iteration · **P3** = polish
> **Effort:** S = < 1h · M = 1–3h · L = 3h+
>
> Baseline at review time: `go test ./internal/...`, `go vet ./internal/...`, and `tsc --noEmit` all pass. The working tree had ~26 modified files, so line numbers describe the current uncommitted state.

---

## Start here (P0)

- [x] **F-01** Daily deck never resets and `locked_in` is permanent
- [x] **F-02** Grid/sync requests block on TMDB detail calls
- [x] **F-03** Verdict rating is discarded
- [x] **F-04** Profile sync badge can show yesterday's allowance
- [x] **F-05** Torrent/magnet UI is a presentation risk
- [x] **F-06** Dirty tree / no clean commit or demo state

---

## P0 — Demo blockers and data integrity

### F-01 · Daily deck never resets; lock-in is permanent

- **Status:** Code done — migration `000009` added; run `make db/migration/up` to apply it.
- **Area:** Backend lifecycle
- **Files:** `api/internal/service/recommendation.go:138-174`, `api/internal/repository/postgres/grid.go:19-134`, `api/migrations/000009_add_pool_date_to_daily_pools.up.sql`
- **Problem:** `GenerateGrid` returns whatever is already in `daily_pools`, forever. There is no date column and no date check. `SyncGrid` refuses to run if any row is `locked_in` (`recommendation.go:278-284`). So after the first lock-in, the user can never sync again — not tomorrow, not ever. The ShowtimeHub countdown ("Next daily reel drops in…") is also false.
- **Fix:** Add `pool_date DATE NOT NULL DEFAULT CURRENT_DATE` to `daily_pools`. Include it in `GetByID`. Treat a pool whose `pool_date` is not today as empty, then clear/regenerate. Scope `IsLockedIn` and `GetByID` to today's pool. Keep old rows if you want history; otherwise delete on rollover.
- **Done when:** A second-day request produces a fresh five, no `locked_in` state carries over, and syncs work again.
- **Effort:** M

### F-02 · Grid/sync requests block on TMDB detail calls

- **Status:** Done — detail hydration is enqueued through `runner.Background`; grid requests return immediately.
- **Area:** Backend performance
- **Files:** `api/internal/service/recommendation.go:99-130`, `182`, `261`, `365`
- **Problem:** The current uncommitted diff replaced `runner.Background(...)` with `sync.WaitGroup` + `wg.Wait()` inside the HTTP request. Opening the app or syncing waits on up to five concurrent TMDB detail calls, each with a 10s timeout, inside a 30s request context. The "existing grid needs tagline sync" path blocks too.
- **Fix:** Return the grid immediately. Move detail hydration back to `rs.runner.Background` or a proper job queue with retries. For the existing-grid backfill, enqueue missing taglines and return the current rows.
- **Done when:** `GET /v1/grid/today` and `POST /v1/grid/sync` return in well under a second even when TMDB is slow, and details fill in after.
- **Effort:** S

### F-03 · Verdict rating is discarded

- **Status:** Code done — rating is stored on watched interactions and shown in the Journal. Run `make db/migration/up` to apply migration `000010`.
- **Area:** Data integrity / client
- **Files:** `api/migrations/000010_add_rating_to_user_interactions.up.sql`, `api/internal/domain/interaction.go`, `api/internal/repository/postgres/interaction.go`, `api/internal/handler/recommendation.go`, `app/app/(app)/(tabs)/index.tsx`, `app/app/(app)/(tabs)/journal.tsx`
- **Problem:** `VerdictModal` collects a 1–5 star rating, `handleLogWatched(movie, rating)` receives it, shows "Rated X ★", then sends only `{ action: "watched" }`. The rating is never stored anywhere. The Journal cannot show it and the scorer never learns from it.
- **Fix:** Add `rating SMALLINT NULL` to `user_interactions` (or a `movie_verdicts` table keyed by user + movie + interaction). Extend `RecordInteractionPayload` and the handler. Send the rating with the `watched` action. Show it in the Journal.
- **Done when:** A 5-star verdict is visible in the database and in the Journal after a reload.
- **Effort:** M

### F-04 · Profile sync badge can show yesterday's allowance

- **Status:** Done — `/v1/me` resets due counters before returning the user; profile cache is shorter-lived.
- **Area:** Backend / client consistency
- **Files:** `api/internal/handler/user.go`, `api/internal/service/user.go`, `api/internal/repository/postgres/user.go`, `app/features/profile/hooks/use-profile.ts`
- **Problem:** `ResetDailySyncsIfDue` is only called from `GenerateGrid` and `SyncGrid`. `GET /v1/me` returns the user as loaded by the auth middleware, before any reset. If the profile query resolves first, the badge shows stale syncs. `staleTime: 5 * 60 * 1000` makes it worse.
- **Fix:** Call `ResetDailySyncsIfDue` in `GetMe` (or the auth middleware) before returning the user. Invalidate the profile query after grid generation/sync. Consider lowering the stale time for the sync count.
- **Done when:** Opening the app on a new day shows the correct sync count immediately.
- **Effort:** S

### F-05 · Torrent/magnet UI is a presentation risk

- **Status:** Done — torrents are disabled by default in both API and client; enable with `FEATURE_TORRENTS=true` and `EXPO_PUBLIC_SHOW_TORRENTS=true`.
- **Area:** Product / interview risk
- **Files:** `api/cmd/api/main.go`, `api/.env.example`, `app/.env.example`, `app/features/movies/consants/movies.constants.ts`, `app/features/movies/components/where-to-watch.tsx`
- **Problem:** The Where to Watch section promotes YTS torrents and magnet links. Technically fine, but in an interview it is a legal/policy distraction and it is not part of the recommendation story.
- **Fix:** Put torrent sources behind a `FEATURE_TORRENTS=false` flag and hide the section for the demo. Keep the legal streaming providers, JustWatch link, and universal search links. Do not remove the code; just do not surface it.
- **Done when:** The demo shows streaming availability and search links only.
- **Effort:** S

### F-06 · Dirty tree / no clean commit or demo state

- **Status:** Done — work is committed in logical commits, `demo/reset` resets nightly state, and `demo-v1` tags the checkpoint.
- **Area:** Process / demo hygiene
- **Files:** `api/Makefile`, `api/scripts/reset_demo_state.sql`
- **Problem:** ~26 files are modified but uncommitted, including the blocking TMDB change and several UI rewrites. There is no clean tag to demo from, and the demo DB may contain a stale or locked grid from previous testing.
- **Fix:** Commit or stash the current work, fix P0 first, then create a clean commit/tag (`git tag demo-v1`). Reset or seed the demo database with a known-good user, preferences, and a fresh daily pool.
- **Done when:** `git status` is clean before the demo and a fresh demo account produces the intended first-run flow.
- **Effort:** S

---

## P1 — Fix before the interview

### F-07 · Error mapping returns 500 for client errors

- **Status:** Done — wrapped domain errors map correctly, and handler validation errors use the same `{ "error": "..." }` envelope.
- **Area:** Backend API contract
- **Files:** `api/internal/handler/errors.go`, `api/internal/handler/errors_test.go`, handler files
- **Problem:** Only a handful of errors are mapped. `ErrNotEnoughCandidates`, `ErrMissingGridSessionID`, `ErrDuplicateEmail`, `ErrInvalidEmail`, `ErrPasswordTooShort`, `ErrEditConflict`, `ErrBadParamInput`, and `ErrInvalidAction` all become **500**. Handlers also return `{message: ...}` while middleware returns `{error: ...}`.
- **Fix:** Map domain errors to 400/401/404/409/422. Unify the error envelope, e.g. `{ "error": { "code": "...", "message": "..." } }`. Update the client `getErrorMessage` helper accordingly.
- **Done when:** A duplicate email returns 409, a bad login returns 401, invalid input returns 422, and the client toast shows the server message.
- **Effort:** S

### F-08 · Concurrent 401s can revoke the refresh-token family

- **Status:** Done — refresh calls share one in-flight promise, so concurrent 401s rotate the token once.
- **Area:** Auth / client
- **Files:** `app/lib/api.ts`, `app/features/auth/services/token.service.ts`, `api/internal/service/user.go`
- **Problem:** Multiple requests can receive 401 at the same time. Each calls `refreshAccessToken()` with the same refresh token. The first rotates it; the second sees a revoked token with `replaced_by` and calls `RevokeByFamily`, logging the user out.
- **Fix:** Single-flight the refresh in the client: keep one in-flight promise and let all callers await it. Optionally add a small "refresh in progress" lock in `token.service.ts`. Add a test or a manual two-request reproduction.
- **Done when:** Two simultaneous expired-token requests both succeed with one refresh.
- **Effort:** S

### F-09 · Editing preferences re-runs onboarding, wipes selections, and re-seeds affinities

- **Area:** Backend + client
- **Files:** `app/app/(app)/(tabs)/profile.tsx:204-225`, `app/app/(onboarding)/index.tsx:12-18`, `app/features/onboarding/store/onboarding.store.ts`, `api/internal/handler/onboarding.go:103-113`, `api/internal/service/recommendation.go:443-455`
- **Problem:** "Edit" pushes the user into the onboarding flow with an empty Zustand store, so current preferences are not prefilled. Finishing calls `SeedFromOnboarding` again, adding +1.0 genre affinity every time. Repeated edits inflate the taste profile.
- **Fix:** Add a dedicated preferences edit screen prefilled from `GET /v1/me/preferences`, calling `PUT /v1/me/preferences`. Make seeding idempotent or first-onboarding-only. Do not re-seed on edits.
- **Done when:** Editing a preference preserves the rest, does not change affinity scores, and returns to Profile.
- **Effort:** M

### F-10 · Pick is irreversible before lock-in

- **Area:** Client UX
- **Files:** `app/app/(app)/(tabs)/index.tsx:175-188`, `242-266`
- **Problem:** Once `hasTodayPick` is true, choosing a different movie is blocked. The user can change their mind until they lock in, but the UI does not allow it. The soft "pick" is more final than the hard "lock-in", which is backwards.
- **Fix:** Allow changing the pick until `locked_in`. Show "Change feature" on the feature card. Only lock-in should be final. If you keep the current two-step flow, make step one a shortlist/feature selection and step two "Start tonight."
- **Done when:** A user can pick A, change to B, then lock in B.
- **Effort:** S

### F-11 · Reveal lock and toast enforce the rule instead of the UI

- **Area:** Client UX
- **Files:** `app/app/(app)/(tabs)/index.tsx:64-101`, `350-352`
- **Problem:** Revealing one card blocks opening another until the first is resolved. The rule is enforced with a toast and a carousel scroll, which feels arbitrary. If the user reveals something they do not want, they are forced to skip or mark it watched. There is no "not tonight" exit.
- **Fix:** Make the rule structural with a one-card stack (see R-01). If you keep the carousel, allow multiple revealed cards and only enforce one final feature. Add a graceful "Not tonight" action that ends the session without marking the movie.
- **Done when:** The user can always leave the deck without a bad-faith action, and the next card is only blocked by the UI itself.
- **Effort:** M (stack) / S (carousel rule change)

### F-12 · Confirmation dialogs on every action

- **Area:** Client UX
- **Files:** `app/features/movies/components/action-confirm-modal.tsx`, `app/features/movies/components/movie-actions.tsx:103-113`, `app/app/(app)/(tabs)/index.tsx:215-348`
- **Problem:** Pick, watched, skip, lock-in, and sync all open a dialog. A decision-fatigue app should not add six confirmations. The friction is on reversible actions, while the irreversible one is just another dialog.
- **Fix:** Make skip/seen instant with an undo toast. Keep a confirmation only for lock-in/start. Keep the sync mood sheet, but make it a proper bottom sheet, not a dialog with horizontal chips.
- **Done when:** A skip is one tap, lock-in is the only confirmation, and no action is accidentally destructive.
- **Effort:** M

### F-13 · "Mark watched" is used before watching, and actions are inconsistent

- **Area:** Data model + UX
- **Files:** `app/app/(app)/(tabs)/index.tsx:242-250`, `app/features/movies/components/movie-actions.tsx:76-88`, `api/internal/service/scorer.go:16-23`, `api/internal/domain/interaction.go:17-24`
- **Problem:** During selection the user can "mark watched" before watching. That writes a strong +2.0 affinity, adds it to the Journal, and labels it watched. Separately, the confirmation sends `watchlist_add` even though the dialog says `pick_tonight`; `pick_tonight` is effectively unused. The action taxonomy has duplicate meanings.
- **Fix:** Adopt the three-action model: **Pick**, **Pass**, **Seen it**. Move "Watched" to a post-feature verdict. Remove or repurpose `pick_tonight`/`watchlist_add` so there is one action per intent. Recalibrate weights after the split.
- **Done when:** The Journal only contains movies actually watched, and the same intent is not represented by two action names.
- **Effort:** M

### F-14 · CORS allows `*` and does not handle preflight

- **Area:** Backend / web
- **Files:** `api/internal/handler/middleware/cors.go:5-9`
- **Problem:** The middleware sets `Access-Control-Allow-Origin: *` and returns; it does not handle `OPTIONS`, allowed headers, or methods. Requests with `Authorization` from Expo web will fail preflight.
- **Fix:** Use Echo's CORS middleware with an explicit allowlist, allowed headers (`Authorization`, `Content-Type`), methods, and max age. If web is not a target, disable the web export in the demo and document it.
- **Done when:** An Expo web request with a bearer token passes preflight.
- **Effort:** S

### F-15 · Candidate pool is the top 200 popular movies, then scored

- **Area:** Recommendation quality
- **Files:** `api/internal/repository/postgres/movie.go:144-181`
- **Problem:** `ORDER BY m.popularity DESC LIMIT $2` runs before the scorer. The engine only ranks the 200 most popular movies that pass filters. Niche tastes can never surface. This weakens the "personalized" claim.
- **Fix:** Increase the candidate limit substantially (e.g. 2,000), or do two-stage generation: SQL prefilter by affinity dimensions and a broader popularity cutoff, then score in Go. Add a candidate-count metric so you can see when a user's filters are too narrow.
- **Done when:** A user with a narrow but valid taste profile gets candidates that are not all mainstream popular titles.
- **Effort:** M

### F-16 · History/exclusion rules are wrong for watched and unrevealed movies

- **Area:** Recommendation quality
- **Files:** `api/internal/service/recommendation.go:234-239`, `api/internal/repository/postgres/grid_history.go:50-54`, `api/internal/repository/postgres/movie.go:154-156`
- **Problem:** All five generated movies go into `user_grid_history`, even if never revealed, so they are excluded for 30 days. Meanwhile, a `watched` movie can reappear after the 30-day cleanup because the candidate query does not exclude watched/seen movies permanently.
- **Fix:** Record history on reveal/resolve, not on generation. Treat unrevealed cards as still available. Permanently exclude watched/seen movies (`NOT EXISTS` against interactions). Use different cooldowns for passed vs unseen.
- **Done when:** Unrevealed cards can return in a future deck, and watched movies never do.
- **Effort:** M

### F-17 · Fake notifications and reminder toggles

- **Area:** Client credibility
- **Files:** `app/features/movies/components/notifications-dropdown.tsx:42-72`, `app/app/(app)/(tabs)/profile.tsx:48-49`, `403-441`
- **Problem:** The bell opens hardcoded notifications ("Today's Daily Five is Ready") that do not reflect real state. The profile reminder switches only change local state and reset on remount. "Mark all read" is local only. If an interviewer taps these, credibility drops.
- **Fix:** Remove the bell and the reminder card for now, or label them "Coming soon" and disable them. Do not ship fake state in a portfolio demo.
- **Done when:** Every visible control either works or is clearly marked as future work.
- **Effort:** S

### F-18 · Login/register is the weakest first impression

- **Area:** Client UI
- **Files:** `app/app/(auth)/login.tsx`, `app/app/(auth)/register.tsx`, `app/features/auth/components/login-form.tsx`, `register-form.tsx`
- **Problem:** The first screen is a bare set of Paper inputs with no logo, tagline, visual identity, or keyboard handling. It feels like a starter template, not the product.
- **Fix:** Make auth a brand moment: logo, one-line pitch, one primary action, secondary link, subtle background, keyboard avoidance, and consistent spacing. See R-12.
- **Done when:** The login screen alone communicates what Glimpse is.
- **Effort:** M

### F-19 · Auth hardening: rate limiting and startup validation

- **Area:** Security
- **Files:** `api/cmd/api/main.go:29-61`, `api/internal/handler/user.go`
- **Problem:** No rate limiting on login, register, activation, or password reset. The server starts with an empty `JWT_SECRET`; tokens then fail at validation instead of failing fast. bcrypt cost 12 and refresh rotation are otherwise good.
- **Fix:** Add per-IP + per-email rate limits for auth endpoints. Validate required env vars at startup (`JWT_SECRET`, `DB_DSN`, `TMDB_BEARER_TOKEN`) and exit with a clear error. Add a small auth audit log.
- **Done when:** Brute-force attempts are throttled and a missing secret prevents startup.
- **Effort:** M

### F-20 · `GET /grid/today` has side effects and a double-generation race

- **Area:** Backend design
- **Files:** `api/internal/handler/recommendation.go:28-37`, `api/internal/service/recommendation.go:138-174`
- **Problem:** A GET request generates data. Two concurrent requests can both see an empty grid and both compute/insert; the unique constraint saves you from corruption, but work is duplicated and the response may reflect different sessions.
- **Fix:** Either generate the daily pool in a scheduled job and make GET read-only, or use a Postgres advisory lock / unique `(user_id, pool_date)` constraint around get-or-create. Document the idempotent GET behavior in the API.
- **Done when:** Two simultaneous first-load requests produce one pool and the same session ID.
- **Effort:** M

### F-21 · Affinity weights double-count and genre sums dominate

- **Area:** Recommendation quality
- **Files:** `api/internal/service/scorer.go:16-23`, `40-126`, `api/internal/service/recommendation.go:380-441`
- **Problem:** A single movie can add `watchlist_add +2.5`, `locked_in +3.0`, and `watched +2.0` — up to +7.5 for the same choice. Genre affinity sums across every genre, so a four-genre movie contributes four times a single-value dimension like language/decade/rating. "Seen before" is also treated as a strong positive, which is not necessarily true.
- **Fix:** Give each event one role and one weight. Pick = intent, start = commitment, verdict = outcome. Normalize genre affinity by genre count or weight each dimension. Cap affinity scores. Decide whether "seen" is neutral + exclusion or asks for a quick like/dislike.
- **Done when:** One movie cannot dominate the profile, and the score scale is comparable across dimensions.
- **Effort:** M

### F-22 · Watch providers are hardcoded to the US

- **Area:** Product correctness
- **Files:** `api/internal/tmdb/watch_providers.go:37-44`
- **Problem:** It tries `"US"` and otherwise picks an arbitrary country. There is no user region preference. "Where to watch" can be wrong for non-US users.
- **Fix:** Add a region to user preferences (default from device locale) and pass it to `GetWatchProviders`. Show "not available in your region" instead of an arbitrary country.
- **Done when:** Availability matches the user's selected region.
- **Effort:** S

### F-23 · Fake runtime fallback in the showtime hub

- **Area:** Client correctness
- **Files:** `app/features/movies/components/showtime-hub.tsx:46`
- **Problem:** `const runtime = movieDetails?.runtime ?? 118` invents a 1h58m runtime when the API has no runtime. It looks like real data.
- **Fix:** Only show runtime when known. Use a neutral "Runtime unavailable" or omit the meta item.
- **Done when:** No invented metadata appears in the feature screen.
- **Effort:** S

---

## P2 — Next iteration

### F-24 · Diversity guard is weak

- **Area:** Recommendation quality
- **Files:** `api/internal/service/scorer.go:148-179`
- **Problem:** `enforceDiversity` only swaps slot 5 if **all five** share the first movie's genre. Four horror films + one comedy passes. This is not meaningful diversity.
- **Fix:** Enforce a maximum per primary genre (e.g. 2), vary decade/language, or move to themed decks where coherence matters more than diversity (see R-03).
- **Done when:** A deck cannot be dominated by one genre unless the theme intentionally calls for it.
- **Effort:** S

### F-25 · Mood filter semantics are unclear and partly OR-based

- **Area:** Recommendation quality
- **Files:** `api/internal/service/recommendation.go:100-136`, `api/internal/repository/postgres/movie.go:159-170`
- **Problem:** `psychological` defines `AnyGenres: ["Mystery"]` and `RequireAllGenres: ["Science Fiction", "Thriller"]`, but the SQL treats them as `(Mystery) OR (Sci-Fi AND Thriller)`. That is not obviously the intended "psychological mystery" filter. Tests only assert the filter struct, not the SQL behavior.
- **Fix:** Decide the intended semantics per mood and encode them explicitly (`RequiredGenre`, `AnyGenres`, `RequireAllGenres`, `ExcludedGenres`). Add integration tests against a real Postgres candidate set.
- **Done when:** Each mood has a documented rule and a test that proves the returned candidates match it.
- **Effort:** M

### F-26 · `GenerateGrid` and `SyncGrid` are duplicated; core flow is untested

- **Area:** Maintainability
- **Files:** `api/internal/service/recommendation.go:138-378`, `api/internal/service/recommendation_test.go`
- **Problem:** The two methods are ~90% identical. The only recommendation-service test covers mood filters. There is no test for daily rollover, sync quota, lock-in, or duplicate generation.
- **Fix:** Extract a shared `buildAndStoreGrid(ctx, userID, filter)` helper. Add service tests with mocked repos and one integration test against real Postgres for the full generate → sync → lock → next-day flow.
- **Done when:** The core lifecycle is covered and the two endpoints share one code path.
- **Effort:** M

### F-27 · Dead `runner` dependency and two exploration-rate sources

- **Area:** Backend cleanliness
- **Files:** `api/internal/service/recommendation.go:55-97`, `api/internal/repository/postgres/user.go:244-249`, `api/internal/service/scorer.go:129-131`
- **Problem:** `runner` is injected but unused after the async regression. `users.exploration_rate` is written by `UpdateInteractionsStat` and read into the user, but the scorer ignores it and recomputes `explorationRateFor(totalInteractions)`.
- **Fix:** Restore the background runner usage (F-02) or remove the dependency. Pick one source of truth for exploration; either use the stored column or drop it.
- **Done when:** No injected-but-unused dependency and one documented exploration formula.
- **Effort:** S

### F-28 · Design-system drift and hardcoded colors

- **Area:** Client UI
- **Files:** `app/lib/theme/colors.ts`, `app/app/(app)/movies/[id].tsx`, `app/features/movies/components/*`, `app/app/(app)/(tabs)/profile.tsx`
- **Problem:** The theme defines a palette, but many screens hardcode `#E50914`, `#141414`, `#A1A1AA`, `#18181B`, etc. Login/Profile use Paper defaults while Today uses a custom cinematic style. There is no single visual language.
- **Fix:** Move all colors, spacing, radii, and type styles into tokens. Replace hardcoded values. Define one "quiet cinema" palette (see R-11) and one component layer for buttons, chips, sheets, and cards.
- **Done when:** A grep for hex colors in screen/components is near-empty except for intentional brand assets.
- **Effort:** L

### F-29 · Dead components, debug logs, and misspelled directory

- **Area:** Client cleanup
- **Files:** `app/features/movies/components/discovery-card.tsx`, `genres-multi-select.tsx`, `movie-card.tsx`, `tonight-hero.tsx`, `app/lib/api.ts:11,22`, `app/lib/ky.ts:11`, `app/features/onboarding/hooks/mutations/use-finish-onboarding.ts:22`, `app/features/movies/consants/`
- **Problem:** Four components are unreferenced. The API client logs every request/response. `consants` is misspelled (also called out in `AGENT.md`).
- **Fix:** Delete dead components, remove debug logs, rename `consants` → `constants` and update imports. Add a lint rule if possible.
- **Done when:** No dead files/logs and the directory name is correct.
- **Effort:** S

### F-30 · Documentation is stale and contradicts the code

- **Area:** Docs
- **Files:** `README.md`, `AGENT.md`
- **Problem:** `AGENT.md` says nine daily slots (it is five), references `glimps` paths, says Expo SDK 57 / RN 0.86 (package is SDK 58 / RN 0.88), describes a five-step onboarding (it is four), and recommends Nix while the repo uses devenv. `README.md` also advertises Nix setup.
- **Fix:** Update both docs to the actual stack, flow, commands, and file layout. Add a short architecture diagram and the real daily lifecycle.
- **Done when:** A new contributor can follow the README without hitting a contradiction.
- **Effort:** S

### F-31 · Repo hygiene: stray `web/`, `shared/`, tracked `.idea`

- **Area:** Repo
- **Files:** `web/`, `shared/`, `app/.idea/`
- **Problem:** `web/` is a leftover Next.js starter, `shared/` only contains devenv config, and `.idea/` IDE files are tracked. They add noise and raise "what is this?" questions.
- **Fix:** Remove `web/` and `shared/` if unused, or document their purpose. Remove `.idea/` from git and add it to `.gitignore`. Decide whether vendored Go deps should stay tracked.
- **Done when:** The repo tree only contains things the project needs.
- **Effort:** S

### F-32 · Minor client bugs and rough edges

- **Area:** Client cleanup
- **Files:** `app/app/(onboarding)/disliked.tsx:34`, `app/app/(app)/(tabs)/journal.tsx:20`, `90`, `app/features/movies/components/where-to-watch.tsx:36-53`, `app/features/auth/services/token.service.ts:16`, `app/features/movies/components/action-confirm-modal.tsx:170-178`
- **Problem:**
  - `max_year` defaults to hardcoded `2026` instead of the current year.
  - Journal builds TMDB URLs manually instead of using `tmdbImage`.
  - `canOpenURL` has identical branches.
  - `jwtDecode` can throw on a malformed token.
  - `ActionConfirmModal` updates state during render (`setPrevVisible`).
  - `expo-secure-store` is not supported on web, but the app has a web export.
- **Fix:** Use `new Date().getFullYear()`, the shared image helper, a single `openURL` path, a try/catch around decode, `useEffect`/key for modal reset, and a web storage fallback or disable web auth.
- **Done when:** These screens behave consistently and no console errors appear.
- **Effort:** S

### F-33 · Source lookup is uncached and fetches YTS on every request

- **Area:** Backend performance
- **Files:** `api/internal/service/movie.go:72-105`, `api/internal/tmdb/watch_providers.go`, `api/internal/torrent/yts.go`
- **Problem:** `GetSources` calls TMDB and YTS on every detail view with no cache. YTS has an 8s timeout; a slow response degrades the feature screen.
- **Fix:** Cache provider/torrent results in Postgres or an in-memory TTL cache. Prefetch on detail sync. If torrents are hidden for the demo (F-05), only fetch providers.
- **Done when:** Opening the same movie twice does not hit external APIs twice within the TTL.
- **Effort:** M

### F-34 · Interaction/grid helper semantics are loose

- **Area:** Backend correctness
- **Files:** `api/internal/repository/postgres/grid.go:94-98`, `api/internal/repository/postgres/movie.go:247-254`
- **Problem:** `MarkRevealed` updates all rows for `(user_id, movie_id)`, not the current `grid_session_id`. `UpdateWatchCount` increments `shown_count` for `watched` even if the movie was never revealed, and the distinction between shown/watched is not documented.
- **Fix:** Scope `MarkRevealed` by session or current pool date. Define and test the shown/watched counters. Decide whether `watched` implies `shown`.
- **Done when:** Counters and reveal state are correct across sessions.
- **Effort:** S

### F-35 · Missing engineering infrastructure

- **Area:** Engineering quality
- **Files:** repository-wide
- **Problem:** No CI pipeline, no OpenAPI/Swagger spec, no frontend tests, no E2E tests, no structured request logging/metrics, and no email retry/backoff. These are not demo blockers, but they are interview talking points.
- **Fix:** Add a GitHub Actions workflow (Go test/vet, tsc/lint), an OpenAPI spec generated from handlers, a smoke E2E (login → grid → reveal → pick), request IDs and latency logs, and mailer retries.
- **Done when:** A PR runs tests automatically and the API contract is inspectable.
- **Effort:** L

---

## Suggested execution order

1. **F-01** daily reset — protects the core promise and the demo.
2. **F-02** non-blocking TMDB — protects perceived performance.
3. **F-03** rating persistence — closes the feedback loop.
4. **F-04** sync badge — small consistency fix.
5. **F-05 + F-06** demo surface and clean state.
6. **F-07 + F-08** API errors and refresh race — demo reliability.
7. **F-09 to F-13** client flow fixes — makes the concept coherent.
8. UI redesign work (see `recommendation.md`, especially R-01, R-02, R-05, R-11, R-12).
9. Everything else.

> **Rule for this list:** do not start a P2 item until all P0 and P1 items are `[x]` or explicitly deferred.
