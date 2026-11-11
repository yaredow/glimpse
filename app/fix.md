# Glimpse Frontend — UI/UX Fix Register

**Scope:** `app/` only (Expo SDK 58 / RN 0.88 / React 19, New Architecture on).
**Out of scope:** `api/` (backend) — do not change. No backend contract may be altered by any fix below.
**Audited against:** the repo's own skills — `expo-design-system` (+ `audit.md`, `native-slop.md`), `expo-native-ui`, `expo-animation`, `expo-router`, `expo-data-fetching`, `expo-ui`, `react-native-best-practices`, `improve-ui`.

**Baseline for verification:** `app/` SLOC (app + components + features + lib + hooks) = **15,940**.

| Metric | Count |
|---|---|
| Hardcoded hex outside `lib/theme` | **273** |
| Hardcoded `rgba()`/`rgb()` | **123** |
| Raw `fontSize:` | **207** |
| Raw `borderRadius:` | **120** (11 distinct values) |
| Legacy `shadowColor`/`shadowOpacity`/`elevation` | **57** |
| `boxShadow` (correct API) | **0** |
| `borderCurve: 'continuous'` | **0** |
| `Dimensions.get()` at module scope | **9** |
| `useWindowDimensions()` | **2** |
| Files with `<Pressable>` lacking a11y role/label | **17 of 31** |
| `fontFamily:` outside the theme | **128** |
| `useReducedMotion` | **0** |

---

## Severity scale

| Level | Meaning |
|---|---|
| **S1 — Critical** | Breaks the product flow, silently loses data, or renders visibly wrong. Fix first. |
| **S2 — High** | Degrades the brand / breaks visual coherence across screens. |
| **S3 — Medium** | Consistency, responsiveness, accessibility, platform-idiom violations. |
| **S4 — Low** | Dead code, hygiene, cleanup. Safe to batch. |

**Execution order matters.** S2-01 → S2-06 are *foundational*: they create the token layer every later fix consumes. Do not start reskinning screens before those land, or the work gets re-done.

---

## Progress

| ID | Item | Status |
|---|---|---|
| S1-01 | Primary buttons render their label in black | ✅ Fixed |
| S1-03 | Default era resolves to "Pre-1970" instead of "Everything" | ✅ Fixed |
| S1-05 | Cold start redirects before hydration | ✅ Fixed |
| S1-06 | A malformed JWT breaks every API request with no recovery | ✅ Fixed |
| S1-07 | Grid fetch failure is rendered as a blank screen | ✅ Fixed |
| S1-08 | Review fetch errors are reported as "no reviews yet" | ✅ Fixed |
| S1-09 | Buttons crash when their label contains an expression | ✅ Fixed |
| S1-10 | `className` is silently dropped on `Animated.*` components | ✅ Fixed |
| S3-30 | Auth screens have no back affordance | ✅ Fixed |
| S3-31 | `AuthTextLink` double-navigates | ✅ Fixed |
| S3-32 | The auth backdrop changes between screens | ✅ Fixed |
| S3-34 | Success screens yank the user after 2.4 s | ✅ Fixed |
| S3-41 | Rating preset shows 6.0 while the store holds 0 | ✅ Fixed |
| S3-43 | Step-4 chip icon contradicts step 1 | ✅ Fixed |
| S4-16 | Forgot-password does not forward the email | ✅ Fixed |

**Still open in S1 — both need a product decision:**
- **S1-02** — is *"revealed"* a real product event, or should the prop be deleted? Calling `onReveal` writes an extra interaction to the backend, which changes the affinity signal.
- **S1-04** — from the Journal, should the Pass/Seen/Pick row be **disabled with a reason**, or should the app resolve the active grid session so the row **works**?

Everything else in S1 is done.

---

# The target design language (decide once, apply everywhere)

Before fixing anything, agree on these values. They are derived from what the app already does most consistently, so nothing here is invented.

| Token class | Value | Source of truth today |
|---|---|---|
| **Primary** | `#E50914` | `lib/theme/colors.ts` `palette.cinemaRed` — already used everywhere |
| **Accent (rating / tonight)** | `#F59E0B` | `palette.gold` |
| **Success** | `#10B981` | `palette.emerald` |
| **Error** | `#EF4444` | `themeColors.error` (currently hardcoded at `colors.ts:50`) |
| **App background** | **one** value — pick `#0C0C0E` (the most-used) and delete `#121212` / `#0B0B0D` / `#141414` | 4 values in use today |
| **Surface ramp** | `zinc900 #181818 → zinc700 #333333` (6 steps) | `palette.zinc*` |
| **Text** | `#FFFFFF` / `#A1A1AA` / `#71717A` | `palette.zinc400` / `palette.zinc500` |
| **Hairline** | `rgba(255,255,255,0.08)` — translucent, everywhere | `palette.glassBorder` |
| **Type** | Plus Jakarta Sans, 5 weights, set **via `fontFamily` only** (never `fontWeight` on a custom family) | `lib/theme/typography.ts` |
| **Spacing** | 4-pt grid: `4 / 8 / 12 / 16 / 24 / 32 / 48` — **screen gutter = 16** | derived from usage |
| **Radius** | `sm 8 / md 12 / lg 16 / full 9999` — plus `borderCurve: 'continuous'` | derived from usage |
| **Elevation** | 3 levels as `boxShadow` strings | derived from usage |
| **Motion** | `fast 120 / base 220 / slow 400`; easing `Easing.bezier(0.23, 1, 0.32, 1)` | derived from usage |
| **Icons** | **one** family. Recommend Phosphor (already used in 12 files incl. the newest code) and delete `@expo/vector-icons` usage | 2 families in use |

**Storage format.** The app is NativeWind (Tailwind v3). Per `expo-design-system`: keep tokens in `global.css` as CSS variables **and** mirror them in `lib/theme/` for the non-NativeWind consumers — **but the two must be generated from one source**, not hand-written twice. Recommended: one TS file (`lib/theme/tokens.ts`) exports the raw values; `global.css` holds the HSL triplets that Tailwind compiles; `lib/theme/colors.ts` derives `palette`/`themeColors` from the same values. **Do not** keep the current state where `secondary` means *dark red* in Paper and *neutral grey* in Tailwind, and `border` means *translucent* in Paper and *opaque* in Tailwind.

---

# S1 — Critical

### S1-01 · Primary buttons render their label in black
**Status:** ✅ Fixed — `components/ui/button.tsx` now renders string children with the custom `Text` (`@/components/ui/text`), which consumes `TextClassContext` and therefore receives `buttonTextVariants`. Inline `style` (the `textColor` prop) keeps higher specificity than `className` in NativeWind v4, so the override still wins.
**File:** `components/ui/button.tsx:4, 134, 145`

`Text` is imported from `react-native` (line 4), but `buttonTextVariants` is delivered through `TextClassContext` (line 134), which only `components/ui/text.tsx` consumes. String children therefore render in RN's default text colour, **not** `text-white`.

Affected (all pass string children with `variant="primary"`, i.e. `bg-primary` red):
`features/onboarding/components/era-selector.tsx:128` · `genre-selector.tsx:93` · `excluded-genre-selector.tsx:98,109` · `language-rating-selector.tsx:168`

**Fix:** render string children with the custom `Text` (`@/components/ui/text`), or apply `buttonTextVariants(...)` directly to the RN `Text` via `className`. Keep `TextClassContext` for nested custom `Text` children.
**Verify:** every onboarding "Continue" / "Complete" label is white on red on both platforms.

### S1-02 · The `revealed` interaction is never recorded
**Files:** `features/movies/components/deck-stack.tsx:116` · `features/movies/components/mystery-card.tsx:20` · `app/(app)/(tabs)/index.tsx:589`

`index.tsx` passes `onReveal={handleReveal}`, but `deck-stack.tsx:116` destructures it as `onReveal: _onReveal` and never calls it. `mystery-card` declares an `onReveal` prop that is never passed or invoked. The server's `is_revealed` flag therefore never becomes true from a user action, and `"revealed"` only ever fires as a side-effect of picking/skipping.

**Fix:** call `onReveal(movie)` when the top card is revealed (or remove the prop and the now-dead `handleReveal` in `index.tsx:144-160` if revealing is not a product concept). Pick one; do not leave a dangling callback.
**Verify:** `POST /v1/grid/interactions` receives `action: "revealed"` on first card reveal.

### S1-03 · Default era resolves to "Pre-1970" instead of "Everything"
**Status:** ✅ Fixed — `era-selector.tsx` now defaults to the **widest** preset via a `widestEra()` helper (largest `max_year - min_year` span), which resolves to "Everything" (1888 → current year). The persisted-selection branch already matched on `min_year` **and** `max_year`, so it was unambiguous and is unchanged.
**File:** `features/onboarding/components/era-selector.tsx:31-43`

`eras.find((e) => e.min_year === 1888)` returns the **first** match. In `features/onboarding/constants/onboarding-data.ts:25-53`, "Timeless Cinema (Pre-1970)" (1888–1969) precedes "Everything" (1888–current year). The inline comment says *"Default to 'Everything' or first"* — the intent is Everything.

Impact: a user who taps straight through onboarding is filtered to pre-1970 films, silently.

**Fix:** select by identity, not by `min_year` — e.g. find the preset whose `max_year` is also the current year, or add an explicit `id: "everything"` to `ONBOARDING_ERAS` and match on it.
**Verify:** the default selection shows "Everything"; `min_year=1888, max_year=<current year>` is submitted.

### S1-04 · Detail-screen action row is inert when opened from the Journal
**File:** `features/movies/components/movie-actions.tsx:47` · `app/(app)/(tabs)/journal.tsx:78-81`

`handleAction` returns early when `!sessionId`. The Journal navigates with only `{ id }`, so Pass / Seen / Pick render as enabled-looking buttons that **do nothing and give no feedback**.

**Fix:** either resolve the active grid session for the movie before rendering the action row, or disable the row with an explanatory label (e.g. "Actions are only available from tonight's reel"). Do not leave enabled-looking no-ops.
**Verify:** the action row is either functional or visibly disabled with a reason.

### S1-05 · Cold start redirects before hydration
**Status:** ✅ Fixed — routing now has a **single owner** (the root layout effect).
**Files:** `app/app/index.tsx` · `app/app/_layout.tsx` · `features/auth/store/auth.store.ts`

The index route previously redirected itself *and* the root layout redirected again, so:
- an authenticated-but-not-onboarded user was sent to `/(app)/(tabs)` and then bounced to `/(onboarding)` — two navigations;
- a failed `GET /v1/me/preferences` set `isFetched`, so `isOnboarded` was `false` and the user was dumped back into onboarding, discarding their setup;
- logout raced two destinations — `useLogout` → `/(auth)/login` vs the root effect → `/(auth)/welcome`.

**What changed**
- `app/app/index.tsx` no longer navigates. It renders the states where no decision can be made: a spinner while preferences load, and an error + **Try again** when that request fails.
- The root effect is the only navigator. It skips the onboarding redirect when the preferences request **errored**, leaving the index route to offer a retry.
- `hasAuthenticated` was added to the auth store (set once a session has existed, never reset by logout) so the root effect can distinguish "never signed in" → `/(auth)/welcome` from "session ended" → `/(auth)/login`. Both now agree with `useLogout`.

**Verify:** fresh install → welcome · returning user → Today tab · new signed-in user → onboarding (one navigation) · logout → sign-in · API down → error + retry, not onboarding.

### S1-06 · A malformed JWT breaks every API request with no recovery
**Status:** ✅ Fixed — `jwtDecode` is now wrapped in `decodeExpiry()`, which returns `null` on an unreadable token; a `null` expiry forces a refresh instead of throwing inside the request interceptor. `performRefresh()` now signs the user out when no refresh token exists, so the recovery path always terminates in a clean signed-out state rather than a dead app.
**File:** `features/auth/services/token.service.ts:18`

`jwtDecode<{ exp }>(token)` is not wrapped in `try/catch`. A corrupted SecureStore value throws inside the Ky `beforeRequest` hook, so every subsequent request fails with a decode error and the user cannot recover without reinstalling.

**Fix:** wrap the decode; on failure treat the token as invalid → force `refreshAccessToken()`, and if that fails, `logout()`.
**Verify:** a deliberately corrupted token leads to a clean re-login, not a dead app.

### S1-07 · Grid fetch failure is rendered as a blank screen
**Status:** ✅ Fixed — `app/(app)/(tabs)/index.tsx`
**File:** `app/(app)/(tabs)/index.tsx:34`

`useGetTodaysGrid()`'s `isError` was ignored. A failed fetch yields `movies.length === 0`; `DeckStack`'s `isDeckCompleted` is guarded by `movies.length > 0`, so the "reel closed" card does **not** render either — the user got a **blank deck area** with just the header, and no explanation and no retry.

**What changed:** the Today tab now has three distinct deck states — loading (skeleton), **error** (icon, explanation and a **Try again** button that calls `refetch()`), and **true empty** ("Tonight's reel is empty" + a **Draw a fresh reel** action wired to the existing sync prompt, which already handles the "no syncs left" case). The "reel resolved" card keeps its meaning: the user worked through every film.
**Verify:** with the grid endpoint failing, the Today tab shows an error + retry; with an empty grid it shows the empty state, not a blank area.

### S1-09 · Buttons crash when their label contains an expression
**Status:** ✅ Fixed — `components/ui/button.tsx`
**File:** `components/ui/button.tsx` (children branch) · `features/onboarding/components/excluded-genre-selector.tsx:98`

`Button` only wrapped its children in a `<Text>` when `typeof children === 'string'`. A JSX label built from an expression — `Exclude {count} {count === 1 ? "Genre" : "Genres"} & Complete` — produces an **array** of strings and numbers, not a string. That array fell through to the raw `children` branch and was rendered straight into the Pressable's `View`, producing:

> ERROR  Text strings must be rendered within a `<Text>` component.

**Trigger:** the dealbreakers step. The label is the plain string *"No Dealbreakers — Start Discovering"* until you select a genre, at which point it becomes the array form — so the crash appears the moment you click a chip. **Pre-existing**, not caused by any other fix in this register.

**What changed:** an `isPlainTextContent()` helper treats a string, a number, or an array made up entirely of strings/numbers/`null`/`undefined`/`boolean` as text content and wraps it in a single `<Text>`. React elements are still rendered as-is, so the auth buttons (which pass a styled `<Text>`) are unaffected. The whole array is wrapped in **one** `<Text>` rather than one per fragment, so the label stays on a single line.
**Verify:** select a dealbreaker genre — the button label renders inline as "Exclude 1 Genre & Complete" with no error.

### S1-10 · `className` is silently dropped on `Animated.*` components
**Status:** ✅ Fixed — `features/auth/components/auth-field.tsx`, `auth-shell.tsx`, `app/(auth)/{activate,reset-password,check-email,forgot-password}.tsx`
**File:** every `<Animated.Text>` / `<Animated.View>` that carried a `className`

NativeWind's interop is applied by the JSX runtime, which replaces the element *type* with an interop wrapper. `react-native-reanimated` renders its own host component through `react/jsx-runtime` (not the NativeWind one), so the interop is bypassed and `className` reaches the raw React Native component as an unknown prop — where it does nothing.

Verified by compiling the JSX:

```js
// <Animated.View className="w-20 h-20 rounded-full" />
(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.View, { className: "w-20 h-20 rounded-full", ... })
// -> wrapJSX: interopComponents.get(Animated.View) === undefined -> unchanged
// -> Reanimated renders the raw RN View with an ignored `className`
```

**Impact:** the auth screen's input field lost `flex-row items-center px-4 h-[54px] rounded-2xl border gap-3` — so the icon and the input stacked vertically, with no height, padding, border or radius. The auth title lost `text-2xl font-bold text-white text-center` — 17 px black text on a black backdrop. The check-email / forgot-password pulse circles and the activate / reset-password success badges lost their size, background and centring entirely.

**What changed:** every `Animated.*` in the app now carries a real `style` object instead of a `className`. `components/ui/button.tsx` and `components/ui/text.tsx` are unaffected — they render plain RN components, so their `className` works.
**Verify:** the auth input is a 54 px rounded bordered row with the icon beside the text; the screen title is 24 px bold white and centred.

### S1-08 · Review fetch errors are reported as "no reviews yet"**Status:** ✅ Fixed — `features/movies/components/movie-reviews.tsx`
**File:** `features/movies/components/movie-reviews.tsx:89`

`if (isError || reviews.length === 0)` rendered the empty state for both cases, so a server failure told the user there were no reviews.

**What changed:** three distinct branches — loading, error (with a **Try again** action), and empty. When cached reviews exist *and* a refresh fails, the reviews stay on screen behind a non-blocking "Couldn't refresh — showing saved reviews" banner with a **Retry**, rather than being replaced by the error state.
**Verify:** with the reviews endpoint failing, the REVIEWS tab shows an error with retry; with a failing refresh over cached data, the reviews remain visible with a banner.

---

# S2 — High

### S2-01 · Three parallel token systems that disagree
**Files:** `lib/theme/colors.ts` · `global.css` · 273 hardcoded hex literals

`lib/theme/colors.ts` (hex, Paper) and `global.css` (HSL, Tailwind) define overlapping concepts with **different values**. Worst collisions:

| Concept | Paper | Tailwind | Effect |
|---|---|---|---|
| `secondary` | `#831010` (dark red) | `240 5% 15%` ≈ `#242428` (grey) | same word, two meanings |
| `border` | `rgba(255,255,255,0.08)` translucent | `240 5% 15%` opaque | two different border languages |
| `background` | `#121212` | `#0B0B0D` | near-black drift |
| `muted-foreground` | `#A1A1AA` | ≈`#8E8E99` | text drift |

Only **13 of 45** files that hardcode colours actually reach for `themeColors`; 32 use literals exclusively.

**Fix:** one token source (see "Target design language"), then sweep literals file-by-file. Do not create a second theme file — extend the existing one.
**Verify:** `grep -rEn '#[0-9a-fA-F]{6}' app components features lib hooks | grep -v lib/theme` returns only intentional one-offs with a comment.

### S2-02 · Two typefaces render on the same screen
**Files:** `components/ui/text.tsx` (no `fontFamily`) vs `lib/theme/typography.ts`

NativeWind `className` text sets `fontWeight` only — never `fontFamily` — so it renders in the **system font** (Roboto / SF Pro). Paper and `StyleSheet` text uses Plus Jakarta Sans. `features/auth/components/auth-shell.tsx` shows both in one view.

Related: `lib/theme/typography.ts` overrides `fontFamily` but leaves MD3's `fontWeight` (`400`/`500`) in place, so `Text variant="headlineMedium"` asks RN for a 400-weight face inside `PlusJakartaSans_700Bold` — unsatisfiable on Android, so the weight is accidental.

**Fix:** set `fontFamily` (never `fontWeight`) on every type-ramp entry; give `components/ui/text.tsx` a base `fontFamily` so NativeWind text inherits the brand face; set `fontWeight` on the MD3 slots to match.
**Verify:** one typeface everywhere; weights visibly differ on Android.

### S2-03 · Four different "app background" blacks
**Files:** `lib/theme/colors.ts:42` (`#121212`) · `global.css:7` (`#0B0B0D`) · `app/_layout.tsx:28,55,146` + `app.json:14,27,47,50` (`#0C0C0E`) · `app/(app)/movies/[id].tsx:207` (`#141414`)

Plus 12 further off-palette surface colours: `#1C1C1F #1C1C1E #161616 #202020 #222225 #141416 #1A1A1A #1F1F1F #262626 #202024 #161618 #0A0A0C`.

**Fix:** one `background` token; one `surface` ramp; delete the rest.
**Verify:** no hardcoded near-black remains outside `lib/theme`.

### S2-04 · `:root` and `.dark` are byte-identical
**File:** `global.css:6-66`

The app is dark-only (`app.json:9` `userInterfaceStyle: "dark"`). The `.dark` block is a verbatim copy of `:root`, and every `dark:` Tailwind variant in the codebase is unreachable.

**Fix:** delete the `.dark` block and the `dark:` variants, or set `darkMode: "media"` and drop `:root` duplication. Do not maintain both.
**Verify:** `grep -rn "dark:" app components features` returns nothing (or the app genuinely supports light).

### S2-05 · 57 legacy shadow props, 0 `boxShadow`
**Files:** worst — `features/movies/components/showtime-hub.tsx` (10) · `deck-stack.tsx` (10) · `app/(app)/(tabs)/index.tsx` (6) · `lib/theme/toast-config.tsx` (5) · `floating-tab-bar.tsx` (5) · `mystery-card.tsx` (5) · `auth-field.tsx` (5)

`expo-native-ui` → *"Use CSS `boxShadow` style prop. NEVER use legacy React Native shadow or elevation styles."* Android `elevation` also re-renders the shadow every frame if animated.

**Fix:** define 2–3 elevation levels as `boxShadow` strings in the theme; convert all 57 sites.
**Verify:** `grep -rEn 'shadow(Color|Offset|Opacity|Radius)|elevation:' app components features` returns 0.

### S2-06 · 120 raw `borderRadius` values, 11 distinct
**Files:** worst — `where-to-watch.tsx` (11) · `app/(app)/(tabs)/profile.tsx` (9) · `edit-preferences-modal.tsx` (8) · `showtime-hub.tsx` (8)

Distinct values in use: `2, 4, 8, 9, 10, 12, 14, 16, 20, 24, 36` — plus Tailwind's `8/10/12/12/16/9999` and Paper's `roundness: 4` (`lib/theme/index.ts` inherits MD3's default and never overrides it).

**Fix:** a `radius` token set (`sm 8 / md 12 / lg 16 / full`); set Paper `roundness` explicitly; add `borderCurve: 'continuous'` to every non-capsule rounded corner.
**Verify:** `grep -rn 'borderRadius:'` outside `lib/theme` returns only token references.

### S2-07 · 207 raw `fontSize` values, no type ramp
**Files:** spread across all features; heaviest in `features/movies/**` and `features/onboarding/**`

**Fix:** a named type ramp (`display / title / headline / body / caption / label`) exposed through one `ThemedText`-style component; convert `fontSize` first (per `audit.md` §5: typography before spacing before colours).
**Verify:** `grep -rn 'fontSize:'` outside the theme returns 0.

### S2-08 · Three different screen gutters
**Files:** `explore-header.tsx:20` (20) · `decision-vitals-strip.tsx` (16) · `movie-actions.tsx` (16) · `pre-show-brief.tsx` (20) · `where-to-watch.tsx` (20) · `app/(app)/(tabs)/index.tsx:751` (24)

16 / 20 / 24 all appear as horizontal page padding within the same feature and across screens. `movie-detail-tabs.tsx` compounds it: the tab content has `padding: 16` and `movie-cast.tsx:43` adds `paddingHorizontal: 16` → a 32 px gutter on the CAST tab only.

**Fix:** one gutter token (16) for screen edges; use `gap` for intra-section rhythm.
**Verify:** every screen's left/right padding is identical.

### S2-09 · The floating tab bar's signature animation never plays
**File:** `features/navigation/components/floating-tab-bar.tsx:2, 19-24, 79-82`

`LayoutAnimation.configureNext(...)` + `UIManager.setLayoutAnimationEnabledExperimental(true)` — `LayoutAnimation` is **not supported on the New Architecture (Fabric)**, and `app.json:10` sets `newArchEnabled: true`. The expanding-pill effect silently does nothing on both platforms; the Android-only `UIManager` call is deprecated and no-ops on iOS.

This is also `native-slop` tell **#5 The Floating Pill Tab Bar**. Two valid routes:
- **(a)** Reimplement the pill growth with Reanimated (`withSpring` on a shared value) and keep the custom dock.
- **(b)** Migrate to `NativeTabs` (`expo-router/unstable-native-tabs`) and drop the custom bar entirely.

Route (b) matches `expo-animation` (*"Tab bar → `NativeTabs`"*) and `native-slop` #5, and removes the hand-rolled chrome — but it is a visible redesign, so it needs product sign-off.

**Also:** `app/(app)/(tabs)/_layout.tsx:10` `tabBarStyle` is dead config (supplying `tabBar` replaces the default bar entirely).

### S2-10 · The movie detail screen uses system fonts and hardcoded colours
**File:** `app/(app)/movies/[id].tsx:207, 236, 275, 279`

While `movie-actions`, `where-to-watch` and `curator-pitch-card` on the **same screen** use the theme, this file hardcodes `#141414` and sets `fontWeight: "bold"` with no `fontFamily` → system font. The screen reads as a different app from the tabs.

**Fix:** convert to `useAppTheme()` + the brand `fontFamily`; move the inline DETAILS-tab markup (`[id].tsx:157-197`) into a component.

### S2-11 · Safe-area collision on the detail hero
**File:** `features/movies/components/movie-header.tsx:111, 124`

`height: 350` and `paddingTop: 80` are magic numbers standing in for status bar + header. 80 px overlaps the notch on some devices and leaves a gap on others. `native-slop` **#17 Safe-Area Collision**.

**Fix:** `useSafeAreaInsets()`; `contentInsetAdjustmentBehavior="automatic"` on the scroll view.

### S2-12 · Detail header title is clipped on notched devices
**File:** `app/(app)/movies/[id].tsx:108, 230`

`animatedHeader` has a fixed `height: 90` and then adds `paddingTop: insets.top` **on top**. With a 59 pt inset the content box is `90 − 59 − 12 = 19 pt` — the title is cut off.

**Fix:** `minHeight: insets.top + 44`, or `height: undefined` + `paddingTop: insets.top` + `paddingVertical`.

### S2-13 · Screen size captured at module scope in 9 files
**Files:** `journal.tsx:21` · `movie-card.tsx:7` · `person-card.tsx:12` · `skeleton-loader.tsx:12` · `tonight-hero.tsx:9` · `discovery-card.tsx:7` · `cinema-trailer-modal.tsx:29` · `showtime-hub.tsx:30` · `deck-stack.tsx:101`

`Dimensions.get("window")` is evaluated once at import → no rotation, split-screen or tablet response. `app.json:17` sets `ios.supportsTablet: true`, and `deck-stack.tsx` also hardcodes a `270`-px chrome allowance that breaks on tall headers.

**Fix:** `useWindowDimensions()`; recompute derived card geometry in a `useMemo` on width/height.
**Verify:** rotate the device and resize an iPad window — layout reflows.

### S2-14 · Two icon families ship at once
**Files:** `@expo/vector-icons` (MaterialCommunityIcons) in **28** files · `phosphor-react-native` in **12** files · `expo-symbols` installed but **0** uses

`expo-native-ui` → *"`expo-symbols` (`SymbolView`) for SF Symbols on iOS, not `@expo/vector-icons`."* Optically, MCI and Phosphor differ in stroke weight and glyph size, so the same action looks different on the auth screen vs the detail screen.

**Fix:** pick one family (Phosphor recommended — newest code already uses it), migrate the 28 MCI files, uninstall `@expo/vector-icons`. Note `react-native-svg` is currently **0** direct imports but is required by Phosphor — add it as an explicit dependency.

### S2-15 · The movie synopsis is never shown
**Files:** `features/movies/types/movies.type.ts:17` (`full_synopsis`) · `features/movies/components/movie-synopsis.tsx` (orphan)

`full_synopsis` exists in the API response and is **never rendered**. The detail page shows `vague_description` (the spoiler-free teaser) inside `CuratorPitchCard` — so users can never read the plot. `movie-synopsis.tsx` was built for exactly this and was orphaned when the DETAILS tab was built.

**Fix:** wire `full_synopsis` into the detail screen (either revive `movie-synopsis.tsx` or add it to the DETAILS tab). Keep `vague_description` for the deck card — that is where it belongs.
**Verify:** the DETAILS tab shows the full plot; the deck card still shows the teaser.

### S2-16 · No reduced-motion support anywhere
**Files:** all of `features/auth/**`, `features/movies/**`, `features/onboarding/**`

`useReducedMotion` appears **0** times. Every entrance animation, the infinite marquee (`tilted-marquee-hero.tsx:52-72`), the envelope pulse (`check-email.tsx:24-32`, `forgot-password.tsx:38-46`), and the skeleton shimmer run regardless of the OS setting. `expo-animation` → *"Reduced motion ships with the animation, not as a follow-up."*

**Fix:** `useReducedMotion()` + `ReduceMotion.System` on every `withTiming`/`withSpring`; gate the marquee and pulse loops entirely.
**Verify:** enabling Reduce Motion on the device stops translation and looping motion while keeping opacity changes.

### S2-17 · 128 `fontFamily:` literals using legacy alias names
**Files:** `features/movies/**` (71 occurrences) · `features/auth/**` · `features/onboarding/**`

Every one says `"Inter_700Bold"` etc. The app actually loads **Plus Jakarta Sans** and re-registers it under the `Inter_*` names in `app/_layout.tsx:40-45`. The alias is load-bearing but undocumented and will break silently if the alias block is removed.

**Fix:** rename all literals to `PlusJakartaSans_*` (or expose a `fonts` map — `lib/theme/typography.ts` already has one, used in exactly one place) and delete the alias block.
**Verify:** no `Inter_` string remains; fonts still render.

### S2-18 · Token file leaks MD3 defaults and hardcodes outside `palette`
**File:** `lib/theme/colors.ts:36, 38, 50, 60, 40-41`

- `secondary: "#831010"`, `secondaryContainer: "#260406"`, `error: "#EF4444"`, `elevation.level5: "#323232"` bypass `palette`.
- `tertiary` / `onTertiary` are overridden (lines 40-41) but `tertiaryContainer` / `onTertiaryContainer` are **not** → they silently keep stock MD3 mauve `rgba(99,59,72,1)` against a Netflix-red theme.

**Fix:** move all values into `palette`; add `tertiaryContainer` / `onTertiaryContainer`.

### S2-19 · Preferences sheet can push its Save button off-screen
**File:** `features/profile/components/edit-preferences-modal.tsx:870`

`styles.scroll` has a hardcoded `maxHeight: 520`. On a 568 pt-tall phone the sheet body is shorter than 520 → the footer is pushed off-screen. On a tablet, 520 leaves a large dead area.

**Fix:** `flex: 1` inside the `maxHeight: "92%"` sheet; drop the pixel cap.

### S2-20 · Error copy promises UI that isn't rendered
**File:** `features/movies/components/where-to-watch.tsx:112-121`

The error branch early-returns with *"Sources currently unavailable. Use universal search below."* — but it returns **before** the universal-search row renders. Dead end.

**Fix:** render the search links in the error branch, or change the copy.

### S2-21 · Provider CTAs don't go to the provider
**Files:** `features/movies/components/showtime-hub.tsx:167-194, 296-299` · `where-to-watch.tsx:150-152`

"STREAM NOW ON NETFLIX" can open a **Google search** (the fallback chain is netflix → justwatch → justwatch → google). Every "Also on: X" pill opens the identical JustWatch URL, so the provider name is decorative. The API's `WatchProvider` carries only `id / name / logo_path` — there is no per-provider URL to use.

**Fix (frontend-only):** relabel the CTA honestly ("FIND WHERE TO WATCH" + provider logos as informational chips) rather than promising a deep link the data cannot support. A real fix needs a backend change (out of scope).

---

# S3 — Medium

### S3-01 · 17 of 31 files with `<Pressable>` have no accessibility role or label
**Files:** all `features/movies/components/*` (except `explore-header.tsx`), `features/onboarding/components/step-layout.tsx`, `features/profile/components/edit-preferences-modal.tsx`

Missing on: the detail back button (`app/(app)/movies/[id].tsx:121-123`), the retry link (`[id].tsx:87-89`), the primary Showtime CTA (`showtime-hub.tsx:249`), the "FINISHED WATCHING? RATE IT" button (`showtime-hub.tsx:379`), provider cards and search pills (`where-to-watch.tsx:148-199, 350-432`), tab bar items (`movie-detail-tabs.tsx:15-19` — no `role="tab"` / `role="tablist"`), the "Read more" toggle (`movie-reviews.tsx:63-70`), `verdict-modal` stars (no `accessibilityState={{selected}}`).

**Fix:** add `accessibilityRole`, `accessibilityLabel` and `accessibilityState` (`selected` / `disabled` / `busy`) to every interactive element.

### S3-02 · Touch targets below 44 pt in ~15 controls
**Worst:** "Read more" toggle (`movie-reviews.tsx:63-70`, ≈15 pt) · provider pills (`showtime-hub.tsx:294-299`, ≈21 pt) · pre-show trailer button (`showtime-hub.tsx:335`, ≈23 pt) · detail trailer button (`movie-header.tsx`, ≈24 pt) · mood chips (`action-confirm-modal.tsx`, ≈29 pt) · sync pill (`explore-header.tsx:57-101`, ≈29 pt) · search pills (`where-to-watch.tsx`, ≈34 pt) · back buttons (38×38) · icon/magnet buttons (36×36).

**Fix:** grow the hit area (or add `hitSlop`) to ≥44 pt. `expo-animation` → *"If the visual is smaller, add `hitSlop` — don't grow the visual."*

### S3-03 · Contrast failures
| Location | Colour | Ratio |
|---|---|---|
| `person-card.tsx:76` character name | `#E50914` on `#141414` @10 pt | **≈3.9:1** ✗ |
| `verdict-modal.tsx:116` button label | `#FFFFFF` on `#10B981` | **≈2.4:1** ✗ |
| `movie-synopsis.tsx` / `movie-card.tsx` headings | `#E50914` on dark @14 pt | ≈3.9:1 ✗ |
| `showtime-hub.tsx` / `decision-vitals-strip.tsx` micro-labels | `#71717A` on `#121212` @10-11 pt | ≈4.15:1 ✗ |
| `movie-reviews.tsx` "Read more" | `#E50914` on `rgba(255,255,255,0.03)` | ≈4.3:1 ✗ |
| `where-to-watch.tsx:146` provider logo | `w185` source rendered at 38 px | blurry, not a contrast issue |

**Fix:** use `palette.onErrorContainer` / `palette.emeraldContainer` for on-colour text; lift micro-labels to `#A1A1AA` and raise their size.

### S3-04 · Tab bar semantics are missing and untyped
**File:** `features/movies/components/movie-detail-tabs.tsx:5, 14-19`

`activeTab: string` / `onTabPress: (tab: string) => void` discard the `DETAIL_TABS` union (`features/movies/consants/movies.constants.ts:22`). A typo renders nothing.

**Fix:** type as `typeof DETAIL_TABS[number]`; add `accessibilityRole="tab"` / `"tablist"` and `accessibilityState={{selected}}`.

### S3-05 · Verdict modal does not reset between opens
**File:** `features/movies/components/verdict-modal.tsx:22`

`useState<number>(4)` is initialised once; rating 5 then cancel then reopen still shows 5. `action-confirm-modal.tsx:127-134` **does** reset — the two modals disagree.

**Fix:** mirror the reset pattern, or lift the state.

### S3-06 · Emoji used as UI glyphs
**Files:** `features/onboarding/utils/genre-meta.ts` (every genre chip) · `language-rating-selector.tsx:21` (`"8.0+ 🏆"`) · `edit-preferences-modal.tsx:54` (`"8.0+ 🏆"`) · `verdict-modal.tsx:93-100` (rating flavour text) · `(tabs)/index.tsx:211,465` (toast text)

`native-slop` **#3 Emoji Iconography**. The `icon` field in `genre-meta.ts` already exists and is never used — swap emoji for Phosphor icons.

**Fix:** replace genre emoji with Phosphor glyphs; drop emoji from rating labels and modal flavour text.

### S3-07 · Preferences sheet conveys selection by colour alone
**File:** `features/profile/components/edit-preferences-modal.tsx:194-216, 784-799`

The Favorite/Excluded segmented switch, the genre chips, era pills and rating pills have no `accessibilityRole`/`accessibilityState`, and the Save button is a bare `Pressable`+`Text`.

**Fix:** `role="radio"` / `role="tab"` + `accessibilityState={{selected}}`; give Save `role="button"`.

### S3-08 · Headers are hand-rolled in 6 places
**Files:** `app/_layout.tsx:141` · `app/(app)/_layout.tsx:11,13` · `app/(app)/(tabs)/_layout.tsx:9` · `app/(auth)/_layout.tsx:9` · `app/(onboarding)/_layout.tsx:5` · `app/(app)/movies/[id].tsx` (custom animated header + back button)

`native-slop` **#11 The Hand-Rolled Header** — loses large-title collapse, back-swipe and scroll-to-top. `expo-native-ui` → *"ALWAYS use a navigation stack title instead of a custom text element on the page."*

**Fix:** at minimum, configure the stack header (`headerTitle`, `headerBackButtonDisplayMode: 'minimal'`) rather than rendering a `<Text>` title. The scroll-collapsing header on the detail screen can stay as a deliberate exception — but then it needs `Stack.Title` set for accessibility.

### S3-09 · Dead header configuration
**File:** `app/(app)/_layout.tsx:11-13`

`headerStyle` / `headerTintColor` are set, but every screen sets `headerShown: false` and no header is ever configured.

### S3-10 · `QueryClient` has no defaults and is never cleared
**File:** `lib/query-provider.tsx:4`

No `staleTime`, `retry`, `refetchOnWindowFocus` or `refetchOnReconnect` → every query is stale-on-mount and refetches on every focus. The cache is also never cleared on logout, so a second user can see the first user's preferences (`authKeys.preferences()` is not user-namespaced and has a 5-minute stale window).

**Fix:** add `defaultOptions` (`staleTime: 60_000`, `retry: 2`); call `queryClient.clear()` in `useLogout`.

### S3-11 · Grid/history refetch on every focus, causing a visible deck jump
**Files:** `features/movies/hooks/query/use-today-grid.ts` · `use-get-history.ts` (`refetchOnMount: "always"`)

Combined with the state-during-render resets below, the deck visibly re-snaps on every tab focus.

**Fix:** keep the always-refetch (the reel resets at midnight) but make the index reset derive from the session id only, not on every render.

### S3-12 · `setState` during render in three places
**File:** `app/(app)/(tabs)/index.tsx:103-109, 113-130`

React's "adjust state when props change" pattern — legal but fragile, and with `experiments.reactCompiler: true` (`app.json:62`) it is a re-render-loop risk.

**Fix:** move to `useEffect` with a session-id dependency.

### S3-13 · Sync icon reads a shared value outside a worklet
**File:** `features/movies/components/sync-button.tsx:27-31`

`rotation.get()` is read on the JS side and the completion callback resets to 0 → visible snap-back. (Also a dead component — S4-05.)

**Fix:** read and write inside the worklet, or use `.get()`/`.set()` per `expo-animation`.

### S3-14 · Deck exit animation advances the index before the reset
**File:** `features/movies/components/deck-stack.tsx:194-215`

The transform reset is in the `withTiming` completion callback (240 ms) but `onFinish()` fires from a separate `setTimeout(…, 200)` — so the index advances **40 ms before** the transform resets and the reset can apply to the *next* card. The timeout is never cleared on unmount.

**Fix:** do the reset and the advance in the same animation callback.

### S3-15 · Dealer's Choice uses four raw timeouts
**File:** `app/(app)/(tabs)/index.tsx:431-483`

Four `setTimeout`s (160/340/500 ms) plus a `Math.max(0, 680 - elapsed)` pad, none cleared on unmount.

**Fix:** use a single Reanimated sequence with `withSequence`/`withDelay`, or a mounted-guarded timeout.

### S3-16 · Picking fires N+1 mutations
**File:** `app/(app)/(tabs)/index.tsx:228-327`

One `recordInteraction` for the pick plus one per demoted tentative pick; each `onSuccess` invalidates `moviesKeys.todayGrid()` → up to N+1 network round-trips and refetches per tap.

**Fix:** invalidate once after the batch settles (`Promise.all` then a single invalidate).

### S3-17 · Skeleton geometry does not match the real card
**File:** `features/movies/components/skeleton-loader.tsx:12-16` vs `deck-stack.tsx:103-108`

Skeleton uses `SW * 0.78` and `* 1.54`; the real card uses `min(SW * 0.88, 356)` and `min(width * 1.5, SH - 270)`. The card jumps when data arrives. The skeleton also always renders **one** card while the deck shows a **three**-card stack, and the placeholder shapes (circle + 2 bars) do not resemble the MysteryCard layout.

**Fix:** import the shared card constants from `deck-stack`; render three stacked skeleton cards matching the real layout.

### S3-18 · Poster over-fetch
**File:** `features/movies/components/mystery-card.tsx:34` — `tmdbImage(poster, "w780")` for a card that renders ≈356 pt wide (2.2× over-fetch, on the deck's main visual).

**Fix:** `w500`.

### S3-19 · Cast card width is computed from screen width but the image is fixed
**File:** `features/movies/components/person-card.tsx:13, 52-53`

`cardWidth = width * 0.22` but the image is a fixed 80×80. On a 320 pt phone the column is 70 pt → the avatar overflows. On a 1024 pt tablet the column is 225 pt → a large empty gap.

**Fix:** derive the image size from the column width, or fix the column width.

### S3-20 · A third clue is silently dropped
**File:** `features/movies/components/mystery-card.tsx:111` — `structuredClues` returns up to 3 (see `features/movies/utils/deck.ts:93-100`) but the card slices to 2.

**Fix:** decide the count once — either render 3 or make the helper return 2.

### S3-21 · Detail poster has no error fallback
**File:** `features/movies/components/movie-header.tsx:91-97` — no `onError` handler, unlike `mystery-card`, `person-card` and `tonight-hero`. A broken URL leaves an empty box.

### S3-22 · Genres are truncated with no affordance
**File:** `features/movies/components/movie-header.tsx:50` — `movie.genres.slice(0, 2)` silently drops the rest.

**Fix:** show all, or `+N`.

### S3-23 · An empty CAST tab renders blank
**File:** `features/movies/components/movie-cast.tsx:10` — `if (cast.length === 0) return null` → the tab is an empty area with no explanation.

### S3-24 · Runtime and end-time formatting is duplicated three times
**Files:** `features/movies/utils/deck.ts:45-64` · `features/movies/components/pre-show-brief.tsx:16-33` · `features/movies/components/showtime-hub.tsx:124-140`

Two of the three use `toLocaleTimeString`, the third a manual 12-hour format → two different time formats on two screens.

**Fix:** one implementation in `utils/deck.ts`; delete the copies.

### S3-25 · Provider de-duplication regex is duplicated
**Files:** `showtime-hub.tsx:67-69` and `where-to-watch.tsx:45-47` — the same `/\s+(Amazon|Apple\s*TV|Roku)\s+Channel.*/i`. The normalisation is used for the dedupe key but **not** applied to the displayed label, so the user still sees "HBO Max Amazon Channel".

**Fix:** one shared helper that returns the cleaned name.

### S3-26 · Buy-to-own availability is never shown
**File:** `features/movies/types/movies.type.ts:136` — `WatchProvidersResult.buy` exists, never rendered.

### S3-27 · Header truncation clips the wrong text
**File:** `features/movies/components/explore-header.tsx:42-43` — `numberOfLines={1}` sits on the outer `Text`; the program theme is a nested `<Text>`, so a long theme truncates the **date** instead.

**Fix:** truncate the theme, not the date.

### S3-28 · Journal list has three conflicting bottom paddings and a dead style
**File:** `app/(app)/(tabs)/journal.tsx:374, 385, 425` — three different inline `paddingBottom` values (`+60`, `+60`, `+80`) on the same screen, each overriding `styles.listContent.paddingBottom: 32` (line 524, dead). `styles.filterPillActive: {}` (line 509) is an empty style object. The `+80` is a magic compensation for the floating tab bar.

### S3-29 · Profile screen mixes libraries and duplicates data
**File:** `app/(app)/(tabs)/profile.tsx`
- The sign-out control is a **Paper `Button`** (line 419) while every other control is a custom `Pressable` / NativeWind `Button` — different radius, elevation, ripple.
- `GENRE_NAMES` (lines 22-42) duplicates the genre map in `features/onboarding/constants/onboarding-data.ts` — two sources of truth.
- `getInitials` (lines 44-51) indexes `w[0]` on an empty word → `"undefined"` in the string.
- `formatDate` (lines 53-59) has no `try/catch` (unlike `journal.tsx:84-91`) → renders "Invalid Date".
- `pref.favorite_genres.length` (line 232) assumes the field exists.

### S3-30 · Auth screens have no back affordance
**File:** `features/auth/components/auth-shell.tsx:30-32` — declares `icon`, `showBack`, `onBack` and **never uses them**. On Android (no back gesture in this stack) a user deep in "Reset password" can only reach login via the text link.

**Fix:** render the back affordance the props already describe, or delete the props.

### S3-31 · `AuthTextLink` double-navigates
**Files:** `features/auth/components/auth-actions.tsx:70-106` + call sites `app/(auth)/welcome.tsx:73-77`, `features/auth/components/login-form.tsx:91-103, 136-140`, `register-form.tsx:144-148`

`AuthTextLink` renders `<Link href asChild><Pressable onPress/></Link>`; passing **both** `href` and `onPress` fires two navigations.

**Fix:** when `href` is present, ignore `onPress` (or drop `href` and keep `onPress`).

### S3-32 · The auth backdrop changes between screens
**File:** `features/auth/components/auth-backdrop.tsx:27-30` — a random backdrop is picked per mount, and each auth screen mounts its own `AuthShell`, so the backdrop reshuffles when navigating between auth screens.

**Fix:** pick once per session (module-level or a context) and keep it stable.

### S3-33 · The pulse animation is duplicated
**Files:** `app/(auth)/check-email.tsx:23-36` and `app/(auth)/forgot-password.tsx:36-51` implement the same repeating pulse.

**Fix:** extract one `PulseCircle` component.

### S3-34 · Success screens yank the user after 2.4 s
**Files:** `app/(auth)/activate.tsx:28-38` and `app/(auth)/reset-password.tsx:65-91` — an auto-`router.replace` after 2400 ms with no way to cancel, alongside a manual button.

**Fix:** keep the manual button as the only exit, or make the timer cancellable on interaction.

### S3-35 · Dead "next" key
**File:** `app/(auth)/reset-password.tsx:114` — `returnKeyType="next"` with no `onSubmitEditing`, so the key does nothing (the login/register forms wire this correctly).

### S3-36 · Every request and response is logged
**Files:** `lib/api.ts:11, 22` · `lib/ky.ts:11` (also logs the base URL at module scope on every import)

**Fix:** gate on `__DEV__`.

### S3-37 · Android cannot render the trailer backdrop blur
**File:** `features/movies/components/cinema-trailer-modal.tsx:282` — `filter: "blur(40px)"` is unsupported on Android → a hard-edged rounded rectangle. It is also GPU-expensive at 90 % width.

**Fix:** use a pre-blurred overlay image, or drop the blur on Android via `Platform.select`.

### S3-38 · The trailer auto-plays with sound
**File:** `features/movies/components/cinema-trailer-modal.tsx:42, 144-168` — `isPlaying` starts `true` and the `YoutubeIframe` is always mounted, so the video loads and plays immediately when the modal opens.

**Fix:** start muted / paused behind a visible play affordance; mount the iframe on first play.

### S3-39 · The onboarding store never syncs with the server
**File:** `features/onboarding/store/onboarding.store.ts:69, 71-79`

`setMode` is never called → `mode` is permanently `"onboarding"` → the `mode === "edit"` branch in `use-finish-onboarding.ts:21` is **unreachable**. `hydrateFromPreference` is never called → after `reset()` in `onSuccess` the local store and the server diverge permanently.

### S3-40 · The onboarding Zod schemas are unused
**File:** `features/onboarding/schemas/onboarding.schema.ts` — all 5 schemas exported, none imported. A `finishOnboardingSchema` with `min_year <= max_year` would have caught S1-03.

### S3-41 · Rating preset shows 6.0 while the store holds 0
**File:** `features/onboarding/components/language-rating-selector.tsx:39` — `initialRating || 6.0` treats a legitimate `0` ("Any Rating") as falsy, so the screen shows 6.0 selected while the store still holds 0 until Continue.

**Fix:** use `??` and an explicit "no selection" check.

### S3-42 · Rating scale mismatch
**Files:** onboarding uses the IMDb 0–10 scale (`language-rating-selector.tsx:17-22`); the profile renders `min_rating` next to a **5-point** star (`app/(app)/(tabs)/profile.tsx:330-342`). The user's own verdict is 1–5 stars (`verdict-modal.tsx`).

**Fix:** pick one scale and label it explicitly in both places.

### S3-43 · Step-4 chip icon contradicts step 1
**File:** `features/onboarding/components/excluded-genre-selector.tsx` — neutral chips show a `＋` (reads as "include this") while step 1 uses `✓` for "selected".

**Fix:** use a consistent affordance language across steps.

### S3-44 · Unused `onBack` props and a dead exit animation
**Files:** `features/onboarding/components/era-selector.tsx:12` and `genre-selector.tsx:14` declare `onBack` and never use it (StepLayout owns the back button). `step-layout.tsx:111` sets `exiting={FadeOut}` which never fires because each step is a separate route.

### S3-45 · Invalid Tailwind config value
**File:** `tailwind.config.js:52-54` — `borderWidth: { hairline: "hairline" }` compiles to `border-width: hairline`, which is not a valid length. Currently unused, so it is a trap.

**Fix:** `"1px"`, or remove it.

### S3-46 · Tailwind content globs omit `./lib/**`
**File:** `tailwind.config.js:4-8` — `./app`, `./components`, `./features` only. A `className` added under `lib/` would silently not compile.

### S3-47 · `rounded-xl` and `rounded-lg` are the same size
**File:** `tailwind.config.js:47-51` — the radius scale overrides `lg`/`md`/`sm` but not `xl`, so `rounded-xl` stays at Tailwind's default 12 px, identical to `rounded-lg`.

**Fix:** define the full scale explicitly.

### S3-48 · The native splash uses the system font
**File:** `app/app.json:54` — `expo-font` is listed as a plugin but there is **no `fonts` array**, so the plugin entry is a no-op and the native splash/launch screen renders in the system font. Fonts are only loaded at runtime in `app/_layout.tsx:33-46`.

**Fix:** move the font config into `app.json` `expo-font` (and add `fonts` to the plugin config), or drop the plugin entry.

### S3-49 · iOS bundle identifier is unset
**File:** `app/app.json` — only `android.package` is configured.

### S3-50 · Tablet support contradicts the layout
**File:** `app/app.json:17` (`ios.supportsTablet: true`) vs a portrait, phone-shaped design — `maxWidth: 420` in `auth-shell.tsx:273`, `maxWidth: 320` in the Today dock, and fixed 3-column grids in `journal.tsx:21-25` / `deck-stack.tsx`.

**Fix:** either honour tablet width (see S2-13) or set `supportsTablet: false` and centre the layout at phone width.

### S3-51 · ProMotion devices are capped at 60 fps
**File:** `app/app.json` — `CADisableMinimumFrameDurationOnPhone` is not set, so third-party animations are capped at 60 fps on ProMotion iPhones.

### S3-52 · Dark splash variant is missing `imageWidth`
**File:** `app/app.json:48-51` — the `dark` variant of the `expo-splash-screen` plugin omits `imageWidth` (the top-level config has 220).

### S3-53 · Dead API-URL branch
**File:** `lib/ky.ts:6` — `Constants.expoConfig?.extra?.apiUrl` is never resolvable because `app.json` has no `extra` block. Only `EXPO_PUBLIC_API_URL` and the emulator fallback apply.

### S3-54 · Connectivity is detected but never surfaced
**Files:** `hooks/use-online-manager.ts:14, 21` · every screen

`state.isConnected` is used but `state.isInternetReachable` is ignored → a captive-portal Wi-Fi reads as online and requests fail instead of pausing. There is **no offline UI anywhere**; queries just stay pending and the skeletons spin forever.

**Fix:** use `isInternetReachable`; render an offline state.

### S3-55 · Navigation chrome uses the system font
**File:** `lib/theme/navigation.ts:22` — `fonts: NavigationDarkTheme.fonts` (system font) while Paper content uses Plus Jakarta Sans. Also `adaptNavigationTheme({reactNavigationDark: NavigationDarkTheme})` is called **without** `glimpseDarkTheme`, so the adaptation is decorative — the six colours are then overridden manually anyway.

**Fix:** pass `glimpseDarkTheme` into `adaptNavigationTheme` and set `fonts: themeFonts`.

### S3-56 · Error and info toasts are identical
**File:** `lib/theme/toast-config.tsx:65-66, 75-76` — both `error` and `info` map to `themeColors.primary` (red).

### S3-57 · Toast and logo bypass the typography token
**Files:** `lib/theme/toast-config.tsx:110, 116` · `components/ui/glimpse-logo.tsx:192, 199` — use the legacy `"Inter_600SemiBold"` / `"Inter_900Black"` aliases instead of `themeFonts` / `fonts`.

### S3-58 · Dead dialog has a web-only accessibility label
**File:** `components/ui/dialog.tsx:94` — `className="sr-only"` is a web-only Tailwind utility; on native it does nothing, so the close button has no accessible label.

### S3-59 · The 401 retry reconstructs a consumed request
**File:** `lib/api.ts:35` — `api.retry({ request: new Request(request, { headers }) })` after the original body was consumed. Breaks on POST/PUT with bodies.

**Fix:** use `ky`'s own retry mechanism or clone the body before the first attempt.

### S3-60 · Reviews are capped at 6 with no "show more"
**File:** `features/movies/components/movie-reviews.tsx:107` — `reviews.slice(0, 6)`; reviews 7+ are invisible with no indication.

### S3-61 · Review rating scale is ambiguous
**File:** `features/movies/types/movies.type.ts:171` — `review.rating` is shown as a bare number next to one star icon with no "/10" or "/5" label, while the app's own user rating is 1–5 stars.

### S3-62 · Vote count is never shown in the vitals strip
**File:** `features/movies/components/decision-vitals-strip.tsx` — `movie.vote_count` is available on the same object but only appears in the DETAILS tab.

### S3-63 · Genre data disagrees with the backend
**File:** `features/movies/consants/movies.constants.ts:1-20` — `GENRES` uses `"Sci-Fi"` and `"Biography"` and omits `"Science Fiction"`, `"Family"`, `"TV Movie"`, while the API returns TMDB names (`features/movies/utils/program.ts:57` correctly uses `"Science Fiction"`).

Currently latent — `GENRES` is only consumed by the dead `genres-multi-select.tsx`. Fix before wiring that component back up.

---

# S4 — Low

### S4-01 · Dead barrels
`lib/colors.ts` (8-line re-export, zero importers) · `components/glimpse-logo.tsx` (2-line re-export, zero importers) · `netflixTheme` alias (`lib/theme/index.ts:11`, zero consumers).

`AGENT.md:60` points at `lib/colors.ts` as the palette — the palette actually lives at `lib/theme/colors.ts`.

### S4-02 · Six unused UI primitives ship a duplicate Card and Dialog
`components/ui/card.tsx` · `badge.tsx` · `avatar.tsx` · `dialog.tsx` (+ `native-only-animated-view.tsx`) · `separator.tsx` — all zero-import. Meanwhile `react-native-paper`'s `Card` and `Dialog` are the ones actually used (`movie-card.tsx`, `discovery-card.tsx`, `action-confirm-modal.tsx`, `verdict-modal.tsx`).

**Decide:** adopt the NativeWind primitives and migrate Paper usages, or delete them. Shipping two Cards and two Dialogs guarantees drift.

### S4-03 · Eight orphan movie components
`discovery-card.tsx` · `genres-multi-select.tsx` · `movie-card.tsx` · `movie-synopsis.tsx` (revive it — S2-15) · `pre-show-brief.tsx` · `sync-button.tsx` · `tonight-hero.tsx` · plus `movie-header.tsx` and `person-card.tsx`, which are reachable only through `movie-trailer.tsx` and `movie-cast.tsx`.

`tonight-hero.tsx` is 402 lines and implements an entirely **amber** design language that conflicts with the cinema-red app — a good reason to delete rather than revive.

### S4-04 · `movie.schema.ts` is entirely dead and mis-typed
`features/movies/schema/movie.schema.ts` — `createMovieSchema` has no consumers and types `runtime` as `string` while the domain model uses `number`.

### S4-05 · Empty files
`features/onboarding/constants/onboarding.constants.ts` · `features/onboarding/constants/onboarding.keys.ts` · `features/onboarding/types/onboarding.types.ts` (the plural twin of `onboarding.type.ts`).

### S4-06 · Dead onboarding components
`features/onboarding/components/language-selector.tsx` (uses Paper `Chip` — a different visual language) · `rating-selector.tsx` (a 0–10 scale with a completely different UI from the live 0/6/7/8 presets).

### S4-07 · Unused types and query keys
`PaginatedResponse` · `MovieFilters` · `moviesKeys.all()` · `moviesKeys.list()` · `features/movies/hooks/query/use-get-movie-details.ts` (a byte-identical duplicate of `use-get-movie.ts` sharing the same query key).

### S4-08 · Dead props, params and styles
`deck-stack.tsx:116` (`_onReveal`) · `mystery-card.tsx:26-27` (`_index`, `_total`) and `:20` (`onReveal`, never passed) · `deck-stack.tsx:684-691` (`backgroundLayer1`, `backgroundLayer2`) · `action-confirm-modal.tsx:102-113` (`sync.renderDescription`, unreachable) · `mystery-card.tsx:240` (`borderTopLeftRadius: 23` vs the card's `24` — an off-by-one to clip the ribbon) · `explore-header.tsx:114` (`backgroundColor: "transparent"`, a no-op).

### S4-09 · Pointless branching
`features/movies/components/where-to-watch.tsx:59-64` — `handleOpenLink` calls `Linking.openURL(url)` in **both** branches of the `canOpenURL` check.

### S4-10 · Over-fetched provider logos
`features/movies/components/where-to-watch.tsx:146` — `tmdbImage(prov.logo_path, "w185")` for a logo rendered at 38×38 (≈23× over-fetch). Same for `person-card.tsx:17`.

### S4-11 · Countdown interval is never cleaned up
`features/movies/components/showtime-hub.tsx:98-113` — a 60 s `setInterval` that is not paused when the app backgrounds (timers throttle, so the countdown drifts).

### S4-12 · Unused profile fields
`features/profile/types/profile.type.ts` — `skips_remaining`, `onboarded`, `suspended_at`, `last_reset_at` are never read. `onboarded` could replace the fragile `favorite_genres.length` heuristic in `app/_layout.tsx:74`.

### S4-13 · The onboarding `mode` flag is not persisted
`features/onboarding/store/onboarding.store.ts:93-101` — `partialize` excludes `mode`, so an app kill mid-edit silently reverts to `"onboarding"` semantics.

### S4-14 · Unused dependencies
`expo-symbols` (0 uses) · `expo-web-browser` (0 uses) · `@expo/ngrok` (0 uses) · `react-native-svg` (0 direct imports but required by Phosphor — add it explicitly) · `react-native-webview` (0 uses; `react-native-youtube-iframe` is used instead).

### S4-15 · Duplicate button variants and a web-only breakpoint
`components/ui/button.tsx` — `variant.default` is byte-identical to `variant.primary`; `variant.link` and `variant.text` are both `''`; `size.sm` and `size.small` are byte-identical; `size.default` uses `sm:h-9`, a **web** breakpoint that never applies on native (so native buttons are `h-10` = 40 pt while web is 36 pt).

Also `components/ui/button.tsx:143` — `<ActivityIndicator color="#FFFFFF" />` hardcodes a hex instead of using the token.

### S4-16 · Forgot-password does not forward the email
`app/(auth)/forgot-password.tsx:70-103` pushes to `/(auth)/reset-password` without the email, so the user retypes it.

### S4-17 · Dead link branch
`features/auth/components/login-form.tsx:96-102` — `try { router.push(...) } catch { router.push("/forgot-password") }` — `router.push` does not throw synchronously, so the fallback is unreachable.

### S4-18 · Brittle error string sniffing
`features/auth/components/login-form.tsx:107-116` — the "Activate your account" link appears only if the server error string contains `"activ"`.

### S4-19 · Secret state never re-syncs
`features/auth/components/auth-field.tsx:97, 220` — `hidden` is initialised from `secure` and never re-syncs if `secure` changes at runtime.

### S4-20 · Unused data in the static datasets
`features/onboarding/constants/onboarding-data.ts` — every `Language.name` (native script: 日本語, Español, …) is never rendered. `features/onboarding/utils/genre-meta.ts` — every `icon` field is never used.

### S4-21 · Query keys are not user-namespaced
`authKeys.preferences()` → `["preferences"]` · `useProfile` → `["profile","me"]`. Neither includes the user id, so a logout/login inside the stale window can show the previous user's data.

### S4-22 · Duplicate "ago" copy
`features/movies/components/deck-stack.tsx:48-99` — the reel-closed copy is copy-pasted four times and hardcodes "3 reshuffles left" instead of using `syncsRemaining`.

### S4-23 · Template leftovers
`assets/images/react-logo.png`, `react-logo@2x.png`, `react-logo@3x.png`, `partial-react-logo.png` — unreferenced Expo template assets.

### S4-24 · Documentation drift
`AGENT.md` is stale on several points: Expo 57 → **58** · RN 0.86 → **0.88** · "React Native Paper 5 with custom MD3 dark Netflix palette (`lib/colors.ts`)" → the palette is at `lib/theme/colors.ts`, and the app now also uses NativeWind/Tailwind, Phosphor and Reanimated · "5-step taste setup" → 4 steps + welcome.

### S4-25 · Misspelled directory
`features/movies/consants/` → `constants/` (note `features/movies/consants/movies.constants.ts` etc.).

### S4-26 · `lib/try-catch.ts` is a general utility used once
`features/auth/services/token.service.ts:47` is its only consumer.

### S4-27 · Typo'd input masking
`app/(auth)/reset-password.tsx` and `activate.tsx` use `fontFamily: "Inter_600SemiBold"`-style legacy aliases via `toast-config`/`glimpse-logo` — covered by S3-57, but the same rename applies to `components/ui/glimpse-logo.tsx:192, 199`.

---

# Acquisition-flow polish (Tier 1)

Six changes that close the visual gap between the **welcome screen**, the **onboarding steps** and the **auth screens**, so the first run reads as one product instead of three.

| # | Change | Where |
|---|---|---|
| 1 | The register screen acknowledges the picks the user already made | `app/(auth)/register.tsx` |
| 2 | One primary button for auth and onboarding (`size="xl"`: 54 px, radius 16, red glow) | `components/ui/button.tsx`, `features/auth/components/auth-actions.tsx`, `features/onboarding/components/*.tsx` |
| 3 | One app background — the onboarding no longer shifts to a second near-black | `features/onboarding/components/step-layout.tsx`, `app/(onboarding)/_layout.tsx`, `lib/theme/colors.ts` |
| 4 | The auth group renders in the brand typeface (and `Animated.*` stopped losing its `className`) | `tailwind.config.js`, `components/ui/{text,button}.tsx`, `features/auth/components/*`, `app/(auth)/*` |
| 5 | One brand lockup component for the welcome screen and the auth shell | `features/auth/components/brand-lockup.tsx` |
| 6 | Activation no longer yanks the user away, and sign-in is prefilled with the email | `app/(auth)/{activate,login,check-email}.tsx`, `features/auth/components/login-form.tsx` |

### Notes

- **The typeface fix is configuration, not a refactor.** `tailwind.config.js` gained a `fontFamily` scale where each weight points at its own Plus Jakarta Sans face (`font-brand`, `font-brandMedium`, `font-brandSemiBold`, `font-brandBold`, `font-brandExtraBold`). Weight utilities such as `font-bold` set a `font-weight` on a family that has no matching face, which Android cannot satisfy — so the family has to change with the weight. The weight utilities in the auth group and in `components/ui/` were swapped for the matching family utility; the rest of the app still uses `font-bold` and friends, which still render in the system font until **S2-02**.
- **Item 4 turned out to be much bigger than one line.** The root cause of the auth group looking like a different app was **S1-10** — `className` does nothing on `Animated.*` components — which had left the auth input fields, the screen title and the success badges unstyled. Fixing the typeface alone would have left that in place.
- **Still open in this flow:** `reset-password.tsx` has the same 2.4 s auto-redirect that activation had (S3-34), and `forgot-password.tsx` does not forward the email to the reset screen (S4-16).

---

# Acquisition-flow polish (Tier 2) — visible UI only

Fifteen changes closing the visible gaps between the **welcome screen**, the **onboarding steps** and the **auth screens**. Tier 3 (the "just show me" path, auto-login, deferring the full-name ask) was deliberately left alone — it changes product behaviour rather than how the flow looks.

### Onboarding — the gap between the two cinematic screens

| # | Change | Where |
|---|---|---|
| 1 | **Brand presence.** The onboarding had zero branding — no logo, no mark. A compact aperture mark + wordmark now sits above the step title, built from the same `BrandLockup` component the welcome and auth screens use (with a new `variant="compact"`) | `features/auth/components/brand-lockup.tsx`, `features/onboarding/components/step-layout.tsx` |
| 2 | **Transition grammar.** The auth group fades between screens; the onboarding used the default iOS push. The whole acquisition flow now fades | `app/(onboarding)/_layout.tsx` |
| 3 | **Title weight.** The step title set `fontWeight: "900"` on Paper's `headlineMedium` — a synthetic weight on a `PlusJakartaSans_700Bold` face, which cannot resolve. It is now the brand 700 face at the auth screen's 24 px | `features/onboarding/components/step-layout.tsx` |
| 4 | **Step badge + progress track.** The badge was `#71717A` at 12 px (≈4.15:1, fails AA) and the inactive segment was a hardcoded `#27272A` while the active one used the theme | `features/onboarding/components/step-layout.tsx` |
| 5 | **`+` vs `✓`.** Step 1 teaches "✓ = picked"; step 4 showed a `+` on unexcluded chips, which reads as "include this genre" — the opposite of what tapping does. Only the excluded state now carries an icon | `features/onboarding/components/excluded-genre-selector.tsx` |
| 6 | **Counters on steps 2–4.** Only step 1 had feedback ("Select at least 2 more"). The era step now shows the chosen range, the language step shows "2 languages · 6.0+ rating", the dealbreaker step shows "2 genres excluded" | the three selectors |
| 7 | **Rating preset lied.** `initialRating \|\| 6.0` treated a stored `0` ("Any Rating") as unset, so the screen showed 6.0 while the store held 0. Now `??`, so the display matches what is submitted | `features/onboarding/components/language-rating-selector.tsx` |
| 8 | **Rating scale.** The preference is an IMDb 0–10 score, but the profile showed it next to a 5-point star, reading as "8 out of 5". It now says "/ 10" | `app/(app)/(tabs)/profile.tsx` |

### Iconography

| # | Change | Where |
|---|---|---|
| 9 | **Emoji as genre icons.** Every genre chip was an emoji (💥 🗺️ 🎨 🍿 …) while the rest of the product uses one icon family. `genre-meta.ts` now maps each genre to a Phosphor icon — its `icon` field already existed and was never used | `features/onboarding/utils/genre-meta.ts`, the two genre selectors |
| 10 | **Two icon families in one flow.** The onboarding used MaterialCommunityIcons, the auth screens Phosphor. The whole acquisition flow is Phosphor now, and `components/ui/glimpse-logo.tsx`'s mark became the brand aperture rather than `camera-iris` | `step-layout.tsx`, `era-selector.tsx`, `language-rating-selector.tsx`, `genre-selector.tsx`, `excluded-genre-selector.tsx`, `components/ui/glimpse-logo.tsx` |

### Auth flow

| # | Change | Where |
|---|---|---|
| 11 | **`AuthTextLink` double-navigated.** `href` *and* `onPress` together made every link navigate twice. The component now runs the caller's `onPress` only when it is not wrapped in a `Link`, and the five redundant `onPress` props were removed | `features/auth/components/auth-actions.tsx`, `welcome.tsx`, `login-form.tsx`, `register-form.tsx` |
| 12 | **No back affordance.** `AuthShell` declared `showBack`/`onBack`/`icon` and never used them, so a user deep in "Reset password" could only escape via a text link. A back control now renders on the screens where a user can get stranded | `features/auth/components/auth-shell.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `activate.tsx` |
| 13 | **The backdrop reshuffled.** A random movie still was picked per mount, so the image changed every time you moved between auth screens. It is now picked once per app run | `features/auth/components/auth-backdrop.tsx` |
| 14 | **`reset-password` yanked the user.** The same 2.4 s auto-redirect that activation had. The success haptic now fires on save and the button is the exit | `app/(auth)/reset-password.tsx` |
| 15 | **Forgot-password dropped the email.** The address the user typed is now forwarded, so the sign-in screen after the reset is prefilled with it | `app/(auth)/forgot-password.tsx`, `reset-password.tsx` |

### Notes

- **The "just show me" path was left alone on purpose.** It changes what the product does, not how it looks — that is your call, not a UI fix.
- **The rating default is still `0`, not `6.0`.** The fix makes the screen honest about what it submits. Changing the *default* to 6.0 would tighten the recommender, which is a product decision rather than a UI one.
- **Still open in this flow:** the pulse animation is duplicated between `check-email` and `forgot-password` (S3-33) and the auth screens still use a dead "next" key on the reset form (S3-35).

---

# Paper → React Native + NativeWind (acquisition flow)

The welcome → onboarding → auth path no longer imports `react-native-paper`. Every `Text` is React Native's, styled with NativeWind classes, and every colour comes from `lib/theme/colors.ts`.

| File | Was | Now |
|---|---|---|
| `features/onboarding/components/step-layout.tsx` | Paper `Text` + `useTheme()` | RN `Text` + `typeClasses` + `palette` |
| `features/onboarding/components/genre-selector.tsx` | Paper `Text` | RN `Text` + `typeClasses.default` |
| `features/onboarding/components/era-selector.tsx` | Paper `Text` | RN `Text` + `typeClasses` |
| `features/onboarding/components/language-rating-selector.tsx` | Paper `Text` | RN `Text` + `typeClasses` |
| `features/onboarding/components/excluded-genre-selector.tsx` | Paper `Text` | RN `Text` + `typeClasses` |
| `features/onboarding/components/language-selector.tsx` *(dead)* | Paper `Text` + `Chip` + `useTheme()` | RN `Text` + `Pressable` chip + `palette` |
| `features/onboarding/components/rating-selector.tsx` *(dead)* | Paper `Text` + `useTheme()` | RN `Text` + `palette` |

### The type ramp

`lib/theme/typography.ts` gained `typeClasses` — MD3's **exact** metrics, so the swap is pixel-identical:

| Slot | Classes |
|---|---|
| `default` | `font-brand` |
| `labelSmall` | `font-brandMedium text-[11px] leading-4 tracking-[0.5px] font-medium` |
| `labelLarge` | `font-brandMedium text-[14px] leading-5 tracking-[0.1px] font-medium` |
| `bodySmall` | `font-brand text-[12px] leading-4 tracking-[0.4px]` |
| `bodyMedium` | `font-brand text-[14px] leading-5 tracking-[0.25px]` |
| `titleMedium` | `font-brandSemiBold text-[16px] leading-6 tracking-[0.15px] font-medium` |
| `headlineMedium` | `font-brandBold text-[28px] leading-9 tracking-normal` |
| `displayLarge` | `font-brandExtraBold text-[57px] leading-[64px] tracking-normal` |

Each step carries its own **family** rather than a `font-weight`, because a weight applied to a single custom family cannot be satisfied on Android. Every caller style still overrides as it did under Paper, so the resolved metrics are identical — verified mechanically for all 20 migrated usages.

### Two things this required

- **`tailwind.config.js` content globs had to include `./lib/**`** (S3-46). The ramp lives in `lib/theme/typography.ts`; without the glob, `text-[12px]`, `tracking-[0.5px]` and `tracking-normal` were never compiled and the ramp silently did nothing.
- **`leading-16` does not exist** in Tailwind v3's line-height scale — `displayLarge` uses `leading-[64px]`.

### Colour substitutions (all exact)

`theme.colors.primary` → `palette.cinemaRed` · `onPrimary` → `palette.white` · `onBackground`/`onSurface` → `palette.offWhite` · `onSurfaceVariant` → `palette.zinc400` · `surfaceVariant` → `palette.zinc850` · `outline` → `palette.zinc750`

Paper remains in `app/_layout.tsx`, `app/(app)/_layout.tsx`, `app/(app)/(tabs)/profile.tsx` and `features/movies/**` — out of scope for this pass.

---

# Group 0 — the foundation (design tokens + theme ownership)

Before any `StyleSheet` can become a class, the values have to exist as utilities and the theme has to stop being Paper's. Two pieces:

## 1. One palette, three representations, one guard

| File | Role |
|---|---|
| `lib/theme/palette.json` | **The source of truth** — every colour as hex |
| `global.css` | The same values as HSL triplets, so Tailwind's opacity modifiers (`bg-primary/90`) keep working |
| `tailwind.config.js` | Maps utility names onto those variables |
| `lib/theme/colors.ts` | The TypeScript view of the same palette |
| `scripts/check-tokens.mjs` | **Asserts the three never drift apart** — `npm run tokens:check` |

The app's greys were lifted from Tailwind's own zinc ramp, so most of them were already exact utilities (`text-zinc-400` = #A1A1AA, `text-zinc-500` = #71717A, `text-zinc-300` = #D4D4D8, `bg-zinc-800` = #27272A, `bg-zinc-900` = #18181B), as were the brand colours (`amber-500` = #F59E0B, `emerald-500` = #10B981, `red-300` = #FCA5A5, `red-500` = #EF4444). Seven utilities were missing and were added: `surface-base`, `surface-raised`, `surface-overlay`, `surface-brand`, `surface-danger`, `off-white`, `error-container`.

## 2. `useAppTheme()` no longer comes from Paper

`useAppTheme` was Paper's `useTheme()`, so every component that wanted a token was coupled to a component library — 11 movie components reached Paper without importing it. It is now `useContext(AppThemeContext)` over our own theme. The values are identical; they just no longer come from Paper's context. `PaperProvider` stays for the Paper components still in `features/movies/**`.

`themeColors` no longer leaks MD3's plum `tertiaryContainer` / `onTertiaryContainer` next to a Netflix-red theme (S2-18), and `global.css` lost its byte-identical `.dark` block — the app is dark-only, so it never applied.

### Visual deltas

All are Δ1 per channel, on near-black surfaces:

| Token | Was | Now | Where |
|---|---|---|---|
| `--primary` / `--ring` | #E60A15 | **#E50914** | the brand red in the auth screens + `Button` |
| `--background` | #0B0B0D | **#0C0C0E** | `bg-background` (the outline button) |
| `--muted-foreground` | #8F8F99 | **#8E8E99** | `text-muted-foreground` |
| `elevation.level5` | #323232 | **#333333** | read by nothing |

## 3. The font family lie, and the rest of the Tailwind config

The Tailwind `fontFamily` scale pointed at `Inter_400Regular` & co — names that were only ever *aliases* for the Plus Jakarta Sans faces, registered under those alias names by `useFonts`. So the config said "Inter" while the app shipped Plus Jakarta Sans.

**Fixed by removing the alias entirely**, not by renaming around it:

- All **142** `Inter_*` literals across **20** files now name the real faces (`PlusJakartaSans_600SemiBold`, etc.).
- The Tailwind scale points at the real faces: `font-brand` → `PlusJakartaSans_400Regular`, `font-brandMedium` → `PlusJakartaSans_500Medium`, … `font-brandExtraBold` → `PlusJakartaSans_800ExtraBold`.
- `useFonts` no longer registers the `Inter_*` aliases — one name per face, and the names are true.

The alias was 1:1 (`Inter_900Black` → `PlusJakartaSans_800ExtraBold`), so this is **exactly** zero visual change.

### The rest of the Tailwind config

| Defect | Fix |
|---|---|
| `borderWidth: { hairline: "hairline" }` compiled to `border-width: hairline` — invalid CSS, and unused | removed |
| `rounded-xl` resolved to the same 12px as `rounded-lg` | the scale is now an explicit progression — 8 / 10 / 12 / 14 / 16 — with no two steps equal. `rounded-md` (10px) and `rounded-2xl` (16px) are live and unchanged |
| `darkMode: "class"` with no `.dark` class anywhere meant the ten `dark:` variants could never fire — in a **dark-only** app, where the dark values are the intended ones | the dark values are baked into the base of the `destructive` / `outline` / `ghost` button variants and the badge, and every `dark:` prefix is gone. `darkMode` is now `"media"` so a future `dark:` utility behaves like ordinary CSS |

Those three variants are **unused** today, so baking the values in changes nothing visible — it removes the trap of someone reaching for `variant="outline"` later and getting light-mode styles in a dark app.

---

# Group 1 — the onboarding, `StyleSheet` → NativeWind

Five live files, **84 style rules** removed, no `StyleSheet.create` left in the onboarding feature.

| File | Rules | Notes |
|---|---|---|
| `features/onboarding/components/step-layout.tsx` | 11 | the `Animated.View` keeps an inline `style` — `className` does not work on animated components (S1-10) |
| `features/onboarding/components/genre-selector.tsx` | 14 | |
| `features/onboarding/components/era-selector.tsx` | 19 | |
| `features/onboarding/components/language-rating-selector.tsx` | 26 | |
| `features/onboarding/components/excluded-genre-selector.tsx` | 14 | |

Every value was mapped to a token-backed utility rather than an arbitrary value — `bg-zinc-900` (#18181B), `border-zinc-800` (#27272A), `bg-surface-brand` (#201012), `text-zinc-400` (#A1A1AA), `text-red-300` (#FCA5A5), `bg-primary` (#E50914) — and the **70 distinct properties were verified against the compiled CSS**: every one resolves to exactly the value the old stylesheet had.

## The app's surface ramp had to be exposed first

The onboarding uses `#333333` for the inactive progress segment. **Tailwind's `zinc-700` is `#3F3F46`**, not `#333333` — the app's ramp is offset from Tailwind's, so `bg-zinc-700` would have shifted that segment by Δ12.

The app's ramp is now exposed under its own namespace (`surface-obsidian`, `surface-charcoal`, `surface-zinc-900` … `surface-zinc-700`, plus the `surface-brand` / `surface-danger` tints), mapped 1:1 to `palette.json` and covered by `npm run tokens:check`. Tailwind's `zinc` scale is untouched — the auth screens depend on it.

---

# Group 1b — the auth feature, `StyleSheet` → NativeWind

The onboarding and the auth screens now share **one** styling language. No `StyleSheet.create` remains in `features/onboarding` or `features/auth`.

| File | What moved |
|---|---|
| `features/auth/components/auth-shell.tsx` | the shell chrome, the back button, the footnote |
| `features/auth/components/tilted-marquee-hero.tsx` | the poster wall and its frames |
| `features/auth/components/brand-lockup.tsx` | the emblem, wordmark and tagline |
| `features/auth/components/auth-backdrop.tsx` | the blurred still and its scrim |
| `features/auth/components/auth-field.tsx` | the input container |
| `features/onboarding/components/rating-selector.tsx` | the dead rating step |
| `features/onboarding/components/language-selector.tsx` | the dead language step |

### Where `className` could not be used

`className` is not applied to **animated** components (S1-10), and `expo-image` / `expo-linear-gradient` are not NativeWind-interopped. Those keep plain `style` objects:

- `auth-shell`'s backdrop zone, logo centerpiece, title and subtitle wrapper
- `brand-lockup`'s emblem, wordmark row and tagline
- `tilted-marquee-hero`'s scrolling column and its `transform`
- `auth-field`'s input container
- `auth-backdrop`'s two images and its gradient

## Two Tailwind traps hit along the way

- **`rounded-xs` does not exist in Tailwind v3** (it is a v4 utility) — it compiled to nothing. The 2px segment radius is `rounded-[2px]`.
- **Opacity modifiers must be multiples of 5** — `bg-primary/18` silently compiled to *nothing*, while `/15` and `/35` worked. The arbitrary form `bg-primary/[0.18]` is used instead.

The marquee's tilt and scale were also moved back into an explicit `transform` rather than relying on NativeWind's composed CSS transform, because that tilt is the signature of the whole screen.

## A regression this caused, and the guard for it

Migrating `tilted-marquee-hero.tsx` put `className` on `expo-image`'s `Image` and `expo-linear-gradient`'s `LinearGradient`. **Neither is NativeWind-interopped** — NativeWind only registers React Native's own components plus a short list of libraries — so the classes were silently dropped:

- the poster `Image` lost its size → the poster wall rendered as **empty cards**
- both gradient scrims lost their size → the **vignette and the full-screen dissolve disappeared**, so the posters no longer softened into black

Both were invisible to `tsc`, `lint` and the token check, because a dropped class is not an error.

**The guard:** `scripts/check-classnames.mjs` (run by `npm run styles:check`) now scans every `.tsx` and fails if `className` appears on an `Animated.*` element or on a component imported from `expo-image`, `expo-linear-gradient`, `expo-blur`, `react-native-svg`, `phosphor-react-native` or `@expo/vector-icons`. It was verified to fail on the reintroduced bug before being left in place.

**Rule for the migrations that follow:** `className` only on React Native's own components (`View`, `Text`, `Pressable`, `ScrollView`, `TextInput`, `SafeAreaView`, `KeyboardAvoidingView`, …). Everything else — `expo-image`, `expo-linear-gradient`, `Animated.*`, Phosphor icons — takes a plain `style` object.

## Verification

Across the 28 migrated files:

```
187 class tokens        ALL COMPILE
122 properties          ALL MATCH THE ORIGINAL STYLE SHEET
26 CSS variables        match palette.json
11 Tailwind utilities   present
```

---

# The auth backdrop was fetching dead URLs

`auth-backdrop.tsx` rendered a bundled PNG **and** a TMDB image over it. All three TMDB URLs return **404** — the fetch had been doing nothing for a while, and the local file was always what rendered.

Two of the three local files were not film stills at all: `backdrop-2.png` and `backdrop-3.png` were **screenshots of the app's own marketing page** (fake `9:41 AM` status bar, "Stream Without Limits" / "Movies That Match You."). Only `backdrop-1.png` was a real still.

Both problems are fixed:

- the TMDB fetch is gone — the backdrop is entirely local, so no network, no pop-in, no dead URLs
- the two mockups were replaced with real film art cropped from the poster assets already in the bundle (`poster-2` Parasite, `poster-10` The Dark Knight), cropped above the title block so no lettering shows

All three are now **576×340** JPEGs, so the bundle cost drops from ~736 KB of PNG to ~137 KB. The blur (`blurRadius={6}`) and the four-stop gradient scrim are untouched.

---

# The welcome screen's dissolve

The marquee's full-screen gradient was ramping to black between 28% and 52% of the screen, which left a heavy black band directly above the GLIMPSE lockup and washed the poster wall out well before it reached it.

Two attempts at "move the ramp" were the wrong fix — the problem was the gradient's **shape**, not where it ended. Both earlier versions had a flat shelf over the upper third and then a compressed knee, which reads as two separate halves: a wall of posters, then a black panel.

It is now a single continuous quadratic ramp — `alpha = (p / 0.56)²` — sampled at 13 stops. Monotonic, smoothly accelerating, no shelf and no knee:

| position | opacity |
|---|---|
| 10% | 0.033 |
| 20% | 0.129 |
| 30% | 0.288 |
| 40% | 0.512 |
| 50% | 0.799 |
| 54.6% (lockup, 6.1" phone) | 0.952 |
| 56% | 1.000 |

The poster wall stays crisp through the top half and dissolves continuously into the black below, so the two halves read as one image rather than a wall sitting on top of a panel.

The lockup's position depends on the device (≈55% on a 6.1" phone, ≈48% on a 4.7" one) — the welcome screen's content is bottom-anchored and the poster window flexes to fill the rest.

---

# Recommended execution order

| Phase | Items | Rationale |
|---|---|---|
| **0 — Decide** | Agree the "Target design language" table; decide S2-09 route (a) or (b); decide the icon family (S2-14) | Everything downstream depends on these three calls |
| **1 — Fix broken behaviour** | S1-01 … S1-08 | These are independent of any design decision and are user-visible bugs |
| **2 — Build the token layer** | S2-01 … S2-08, S2-18 | One source of truth; then sweep files one at a time (`audit.md` §5 order: typography → spacing → colours → radius/shadows) |
| **3 — Platform idiom** | S2-09 … S2-16, S3-01 … S3-08, S3-11 … S3-16, S3-24 … S3-26, S3-36 … S3-38, S3-46, S3-48 … S3-55 | Structural fixes that change how screens are built |
| **4 — Screen polish** | S2-17, S2-19 … S2-23, S3-09, S3-10, S3-17 … S3-23, S3-27 … S3-35, S3-39 … S3-45, S3-56 … S3-63 | Per-screen, one screen per commit, re-running the audit greps scoped to that screen |
| **5 — Cleanup** | S4-01 … S4-26 | Batch; safe to parallelise |
| **6 — Verify** | Re-run the audit greps; scores must fall monotonically | |

---

# Verification commands

Run from `app/`:

```bash
SRC="app components features lib hooks"

# Token escapes — each should approach 0
grep -rEn '#[0-9a-fA-F]{6}\b' $SRC --include='*.tsx' --include='*.ts' | grep -v "^lib/theme/" | wc -l   # was 273
grep -rn 'fontSize:'          $SRC --include='*.tsx' | grep -v "^lib/theme/" | wc -l                            # was 207
grep -rn 'borderRadius:'      $SRC --include='*.tsx' | grep -v "^lib/theme/" | wc -l                            # was 120
grep -rEn 'shadow(Color|Offset|Opacity|Radius)|elevation:' $SRC --include='*.tsx' | wc -l                       # was 57
grep -rn 'boxShadow'          $SRC --include='*.tsx' | wc -l                                                     # want > 0
grep -rn 'borderCurve'        $SRC --include='*.tsx' | wc -l                                                     # want > 0
grep -rn 'Dimensions.get'     $SRC --include='*.tsx' | wc -l                                                     # was 9
grep -rn 'useReducedMotion'   $SRC --include='*.tsx' | wc -l                                                     # want > 0

# Accessibility
grep -rln '<Pressable' $SRC --include='*.tsx' | xargs grep -LE 'accessibility(Role|Label)' | wc -l             # was 17

# Dead code
grep -rn 'use-get-movie-details\|movie.schema\|netflixTheme' $SRC --include='*.ts*'
```

Run `bun run lint` and `npx tsc --noEmit` after every phase.

---

# Non-goals

- **No backend changes.** Where a fix needs data the API does not return (S2-21 per-provider URLs, S2-15 `full_synopsis` is available so it is in scope, S3-26 `providers.buy` is available so it is in scope), prefer the frontend-only option and note the backend requirement in a comment. Do not alter an API contract.
- **No product-intent changes.** If a fix requires deciding *what the app should do* (e.g. whether revealing is a concept, whether the tab bar should be native, whether the rating scale is 0–10 or 1–5), flag it for a product decision rather than guessing.
- **Do not migrate to `@expo/ui`** as part of this register. The skill recommends it for native sheets/controls, but adopting it is a dependency + architectural change that should be a separate, explicitly-approved piece of work. The in-scope target is to make the **existing** component set coherent.
