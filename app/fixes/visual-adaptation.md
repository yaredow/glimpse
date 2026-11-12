# Visual Adaptation Completion

**Status:** blocked until `token-layer.md` (PR 2) and `typography.md` (PR 3) are merged
**Owner:** unassigned
**Depends on:** `token-layer.md`, `typography.md`
**Blocks:** nothing
**Scope:** finish the NativeWind/reusables adoption, fix visual inconsistencies and component bugs. Do not create a second token system.

---

## 1. Current state

| Area | Fact |
|---|---|
| Icons | 17 files still import `MaterialCommunityIcons` from `@expo/vector-icons` (88 usages); 20 files use Phosphor |
| Text colors | 107 `text-white`, 144 `text-zinc-*`, 7 `text-foreground`, 2 `text-off-white` |
| Backgrounds | After token-layer: `bg-background` (#0C0C0E), `bg-surface-1` (#121212), `bg-surface-2` (#141414) coexist |
| Gutters | `px-4` (34), `px-5` (12), `px-6` (7) |
| Inline styles | 67 `style={{ … }}` objects; many are legitimate (insets, Reanimated, gradients) |
| Raw controls | 73 `<Pressable>` tags; `Button` is used in 7 places across 6 files |
| Hardcoded colors | 13 hex + 59 rgba lines outside `lib/theme`, across 19 files |
| Radius | 10 raw `borderRadius` props; 86 arbitrary `rounded-[Npx]` |
| Shadows | 16 `boxShadow`, 2 legacy shadow props |
| Reduced motion | implemented in `check-email`, `forgot-password`, `tilted-marquee-hero`, `dialog`, `skeleton-loader`; missing elsewhere |
| A11y | 49 `accessibilityRole` / 57 `accessibilityLabel`; many raw `Pressable`s lack state; some touch targets < 44pt |

Known bugs:

- `features/movies/components/movie-reviews.tsx:145` uses `text-error-container` — a dark background color (`#3B070A`) as text. Should be `text-error-container-foreground`.
- `components/ui/native-only-animated-view.tsx` spreads `as` into `Animated.View` / `AnimatedPressable`.
- `components/ui/dialog.tsx:96` uses `max-w-[calc(100%-2rem)]` — a web `calc()` pattern in a native primitive. Every caller already overrides it.
- `app/(app)/(tabs)/_layout.tsx` sets `tabBarStyle` although a custom `tabBar` is rendered.
- `components/ui/button.tsx` can let `{...props}` override the computed `disabled` value while loading.
- `components/floating-tab-bar.tsx` uses `LayoutAnimation` + `UIManager.setLayoutAnimationEnabledExperimental` on the New Architecture; the intended animation does not play reliably.
- `components/ui/glimpse-logo.tsx` is app brand code inside `components/ui` and still uses the old theme hook (token-layer removes the hook).
- `features/movies/components/deck-stack.tsx` called JS state updates straight from a Reanimated `withTiming` completion callback, which crashes on the UI runtime when Pass / Seen / Pick is pressed. Fixed with `runOnJS` on this branch.

---

## 2. Target

- One icon family: Phosphor, through the `Icon` wrapper.
- One background per semantic role; no “which black?” decision in screens.
- One text ramp usage: `text-foreground`, `text-subtle-foreground`, `text-faint-foreground`, `text-white` only when pure white is intended.
- One screen gutter (recommend 16px), documented exceptions.
- No static inline styles; inline styles only for dynamic values (insets, dimensions, Reanimated, gradients).
- No hardcoded hex/rgba outside `lib/theme`, except a documented third-party brand list.
- All interactive controls use `Button`/`Pressable` wrappers with a11y props.
- Reduced motion honoured by every animation.

---

## 3. Phases

### VA-0 · Baseline and rules

- [x] Capture the same screenshot set used in `token-layer.md` TL-0 (welcome, login, register, onboarding 1/2/4, Today, Journal, Profile). Movie detail, verdict modal, and check-email are still missing.
- [x] Screen gutter (locked): `px-4` = 16 px for app screens. Auth screens keep `px-6` for the hero shell only, documented in `auth-shell.tsx`.
- [x] Allowed literal list (locked):
  - YouTube brand red `#FF0000`;
  - pure black in shadows/overlays where no token applies;
  - everything else must be a token.
- [x] `text-white` (locked): allowed only for true-white emphasis such as the brand wordmark and primary-button labels; body and secondary text use the ramp.

**Gate:** baseline screenshots stored; the three locked rules are respected in the PR.

### VA-1 · Icon family

- [x] Replace `MaterialCommunityIcons` with Phosphor in the 16 files:
  - `app/(app)/(tabs)/index.tsx`, `journal.tsx`, `movies/[id].tsx`;
  - `features/movies/components/*` (action-confirm-modal, explore-header, movie-actions, verdict-modal, deck-stack, decision-vitals-strip, curator-pitch-card, movie-reviews, movie-header, mystery-card, cinema-trailer-modal, showtime-hub, where-to-watch);
  - `lib/theme/toast-config.tsx`.
- [x] Map each glyph by meaning (check the Phosphor export exists; do not guess):
  `check-circle → CheckCircleIcon`, `alert-circle → WarningCircleIcon`,
  `information → InfoIcon`, `filmstrip → FilmStripIcon`, `wifi-off → WifiSlashIcon`,
  `youtube → YoutubeLogoIcon`, `movie-play-outline → PlayCircleIcon`,
  `arrow-right → ArrowRightIcon`, `arrow-u-left-top → ArrowUUpLeftIcon`,
  `calendar-blank → CalendarBlankIcon`, `user/account → UserIcon`,
  `lock → LockSimpleIcon`, `email → EnvelopeSimpleIcon`, `key → KeyIcon`.
- [x] Prefer `<Icon as={PhosphorIcon} className="text-…" />` so color follows the text token. Use `color={colors.*}` only when the API needs a string.
- [x] Remove `@expo/vector-icons` after the last use (coordinate with `dependency-lockfile-hygiene.md` DH-2).

**Gate:** `grep -rn "@expo/vector-icons\|MaterialCommunityIcons" app components features lib` is empty; screenshots reviewed.

### VA-2 · Color and surface consolidation

Targets are locked in `README.md` §1.1. This is the only phase allowed to change a rendered color.

- [x] Unify the app canvas: `bg-background` (`#0C0C0E`) for every screen root; `surface-1`/`surface-2` only for an intentional inset, documented in the file that uses it.
- [x] Collapse near-duplicate blacks (`#141414`, `#161618`, `#181818`) to `--card` `#161618` in `global.css`, then update the screens that used the removed tokens. Review screenshots before and after.
- [x] Unify the text ramp: `text-foreground` (`#FAFAFA`) for body, `text-subtle-foreground` (`#A1A1AA`) for secondary, `text-faint-foreground` (`#71717A`) for tertiary, `text-white` only where true white is intended. Retire `text-off-white`, `text-muted-foreground`, and `text-zinc-*` from screens.
- [x] Fix `text-error-container` → `text-error-container-foreground` in `movie-reviews.tsx`.
- [x] Replace remaining hardcoded colors:
  - `#EF4444` → `colors.destructive` / `text-destructive`;
  - `#E50914` → `colors.primary`;
  - `#FFFFFF` → `colors.white` / `text-primary-foreground`;
  - `#71717A` → `colors.faintForeground`;
  - `#A1A1AA` → `colors.subtleForeground`;
  - `#121212` → `colors.surface1`;
  - `#0a0a0c`, `#1c1c1f`, `#666` → nearest semantic token;
  - YouTube `#FF0000` → documented literal.
- [x] Add `lib/theme/color.ts` with `withAlpha(hex, alpha)` for animated/gradient colors; use it instead of new rgba tokens.
- [x] Replace `rgba(255,255,255,0.08)` with `border-hairline/10` or `bg-hairline/10` where equivalent.

**Gate:** a grep for hex/rgba outside `lib/theme` returns only the documented literal list; screenshots reviewed.

### VA-3 · Spacing, radius, shadows

- [x] Standardize the screen gutter (VA-0 decision) across `app/`, `features/`, `components/`.
- [x] Replace arbitrary spacing values with the Tailwind scale where they are equivalent.
- [x] Replace arbitrary `rounded-[Npx]` with `rounded-sm/md/lg/xl/2xl/full` unless the value is a deliberate one-off.
- [x] Replace inline `boxShadow` strings with `lib/theme/shadows.ts` (or a Tailwind `boxShadow` token) and delete unused shadow values.
- [x] Delete `lib/theme/shadows.ts` if it stays unused after the sweep.

**Gate:** arbitrary radius/spacing count is at or below the documented exception list; visual review.

### VA-4 · Component and layout fixes

- [x] `components/ui/native-only-animated-view.tsx`: strip `as` before spreading props into `Animated.View` / `AnimatedPressable`.
- [x] `components/ui/dialog.tsx`: remove `max-w-[calc(100%-2rem)]`; callers set `w-[92%] max-w-[380px]`.
- [x] `app/(app)/(tabs)/_layout.tsx`: remove the dead `tabBarStyle` block.
- [x] `components/ui/button.tsx`: ensure the computed `disabled` value cannot be overridden by `{...props}` while `loading`.
- [x] Move `components/ui/glimpse-logo.tsx` to a brand location (`components/brand/glimpse-logo.tsx` or `features/brand/`) and update imports.
- [x] `components/floating-tab-bar.tsx`: replace `LayoutAnimation` + `UIManager` with Reanimated layout (`Layout` / `LinearTransition`) or remove the dead animation; verify on the New Architecture.
- [x] `lib/theme/toast-config.tsx`: finish the Phosphor migration.

**Gate:** `tsc`, `eslint`, device smoke test; tab bar animation behaves.

### VA-5 · A11y and reduced motion

- [x] Every `Pressable`/`Button` has `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` where applicable.
- [x] Touch targets are at least 44×44 for tappable controls.
- [x] Add `useReducedMotion()` + `ReduceMotion.System` to every `withTiming`/`withSpring`/`entering`/`exiting` and gate infinite loops (marquee, pulse, shimmer).
- [x] Check web focus/keyboard where the app supports web.

**Gate:** a11y checklist in the PR; reduced-motion device test (translation stops, opacity still changes).

### VA-6 · Final sweep

- [x] `style={{ … }}` remains only for dynamic values (insets, dimensions, Reanimated, gradients). Static layout/color/style moves to classes.
- [x] Add an ESLint rule or `scripts/check-visual.mjs` for:
  - no `MaterialCommunityIcons`;
  - no raw hex/rgba outside `lib/theme` (allowlist);
  - no `LayoutAnimation`;
  - no `rounded-[` outside allowlist.
- [x] Re-run the screenshot set and compare to VA-0.

**Gate:** all greps pass; final visual sign-off.

---

## 4. Verification

```bash
npx tsc --noEmit
npx eslint app components features lib
grep -rn "@expo/vector-icons\|MaterialCommunityIcons" app components features lib
grep -rn "text-error-container" app components features
grep -rn "LayoutAnimation" app components features
grep -rn "NativeOnlyAnimatedView" app components features
```

Device checks:

- One icon family on every screen.
- One background per role on Today, Journal, Profile, movie detail, auth, onboarding.
- Tab bar animation and dialog animations.
- Reduced motion enabled: no translation/looping motion.
- Web: dialogs, focus states, and text rendering.

---

## 5. Do not

- Do not introduce new token sources or `palette`-style maps.
- Do not change the typography ramp here; that is `typography.md`.
- Do not remove `@expo/vector-icons` until VA-1 is complete.
- Do not mix visual consolidation with the mechanical token migration; this file runs after TL-5.
- Do not replace a hardcoded color with a new hardcoded variable in a component; add a token or use the existing one.

---

## 6. Definition of done

- One icon family.
- One background per semantic role; one documented gutter.
- No hardcoded colors outside `lib/theme` except the allowlist.
- Static inline styles removed.
- Component bugs fixed.
- A11y and reduced-motion checks pass.
- Screenshots match the approved design.
