# Token Layer Collapse

**Status:** ready to implement — values locked in `README.md` §1.1
**Owner:** unassigned
**Depends on:** `dependency-lockfile-hygiene.md` DH-0…DH-3 (PR 1 merged)
**Blocks:** `typography.md`; `visual-adaptation.md`; shares `tailwind.config.js` with `typography.md`
**Scope:** color tokens only. Typography is `typography.md`. Visual changes are `visual-adaptation.md`.

---

## 1. Current state

`app/` defines the same colors in four overlapping places:

| File | What it owns | Problem |
|---|---|---|
| `lib/theme/palette.json` | raw hex values | hand-maintained, also mirrored in CSS |
| `global.css` | HSL triplets consumed by NativeWind | different values from `palette.json` / `themeColors` |
| `lib/theme/colors.ts` | `themeColors` (MD3-shaped), `palette` | Paper-era semantic layer; `secondary`, `background`, `surface`, `border` disagree with CSS |
| `tailwind.config.js` | utility names | correct mapping, but depends on the conflicting CSS values |
| `lib/theme/index.ts` | `glimpseDarkTheme`, `AppThemeContext`, `useAppTheme` | Paper is gone; this is a compatibility shim used by 14 files |

Known collisions:

| Concept | `palette.json` / `themeColors` | `global.css` / Tailwind |
|---|---|---|
| `secondary` | `#831010` (red) | `hsl(240 5% 15%)` (grey) |
| `background` | `#121212` (`obsidian`) | `#0C0C0E` |
| `surface` / `card` | `#141414` | `#161618` |
| `border` | `rgba(255,255,255,0.08)` | `hsl(240 5% 15%)` (opaque) |

`scripts/check-tokens.mjs` passes because it checks only 27 variables and does **not** check `--secondary`, `--border`, `--input`, or `--secondary-foreground`. It cannot detect the collisions above.

`tsc`, `eslint`, and both current scripts pass today.

---

## 2. Target architecture

**CSS-first, one direction of truth:**

```
global.css  ──►  tailwind.config.js  ──►  className utilities in components
     │
     └────────►  scripts/gen-tokens.mjs  ──►  lib/theme/tokens.generated.ts
                                                   │
                                                   └──► JS-only consumers:
                                                        navigation theme, toast config,
                                                        icons, gradients, native config
```

Rules:

1. `global.css` is the only place a color value is written.
2. `tailwind.config.js` contains no hex values; every color points at `hsl(var(--…))`.
3. `tokens.generated.ts` is generated; never hand-edit it.
4. `palette.json`, `themeColors`, `useAppTheme`, and `AppThemeContext` are deleted.
5. Reusables/shadcn token names stay exactly as they are (`--primary`, `--card`, `--border`, `--input`, `--ring`, `--radius`).
6. Raw shade names are not exposed to components. If a screen needs a color, it uses a semantic token.
7. Mechanical phases must be pixel-identical. Value consolidation is `visual-adaptation.md`.

---

## 3. Token contract

All colors are HSL triplets without the `hsl()` wrapper. This keeps opacity modifiers working (`bg-primary/40`, `border-hairline/10`).

### Core (reusables-compatible)

| Token | Hex | HSL | Role |
|---|---|---|---|
| `--background` | `#0C0C0E` | `240 7.7% 5.1%` | app canvas |
| `--foreground` | `#FAFAFA` | `0 0% 98%` | primary text |
| `--card` | `#161618` | `240 4.3% 9%` | card surface |
| `--card-foreground` | `#FAFAFA` | `0 0% 98%` | card text |
| `--popover` | `#161618` | `240 4.3% 9%` | popover surface |
| `--popover-foreground` | `#FAFAFA` | `0 0% 98%` | popover text |
| `--primary` | `#E50914` | `357 92.4% 46.7%` | brand / primary action |
| `--primary-foreground` | `#FFFFFF` | `0 0% 100%` | text on primary |
| `--primary-hover` | `#B20710` | `356.8 92.4% 36.3%` | primary pressed/hover |
| `--secondary` | `#242428` | `240 5.3% 14.9%` | secondary action (grey) |
| `--secondary-foreground` | `#FAFAFA` | `0 0% 98%` | text on secondary |
| `--muted` | `#2C2C30` | `240 4.3% 18%` | muted surface |
| `--muted-foreground` | `#8E8E99` | `240 5.1% 57.8%` | reusables muted text |
| `--subtle-foreground` | `#A1A1AA` | `240 5% 64.9%` | app secondary text |
| `--faint-foreground` | `#71717A` | `240 3.8% 46.1%` | app tertiary text |
| `--accent` | `#2C2C30` | `240 4.3% 18%` | accent surface |
| `--accent-foreground` | `#FAFAFA` | `0 0% 98%` | accent text |
| `--destructive` | `#EF4444` | `0 84.2% 60.2%` | error / destructive |
| `--destructive-foreground` | `#FAFAFA` | `0 0% 98%` | text on destructive |
| `--border` | `#242428` | `240 5.3% 14.9%` | opaque control border |
| `--input` | `#242428` | `240 5.3% 14.9%` | input border |
| `--ring` | `#E50914` | `357 92.4% 46.7%` | focus ring |
| `--hairline` | `#FFFFFF` | `0 0% 100%` | translucent separators; use `border-hairline/10` |

### App surfaces and accents

| Token | Hex | HSL | Role |
|---|---|---|---|
| `--surface-1` | `#121212` | `0 0% 7.1%` | app screen inset |
| `--surface-2` | `#141414` | `0 0% 7.8%` | detail/inset |
| `--surface-3` | `#161618` | `240 4.3% 9%` | card (same value as `--card`) |
| `--surface-4` | `#181818` | `0 0% 9.4%` | raised surface |
| `--surface-5` | `#1E1E1E` | `0 0% 11.8%` | control / button surface |
| `--surface-6` | `#242424` | `0 0% 14.1%` | hover / pressed |
| `--surface-7` | `#2A2A2A` | `0 0% 16.5%` | strong surface |
| `--surface-8` | `#333333` | `0 0% 20%` | highest surface |
| `--brand-surface` | `#201012` | `352.5 33.3% 9.4%` | selected brand tint |
| `--danger-surface` | `#200E10` | `353.3 39.1% 9%` | selected danger tint |
| `--off-white` | `#F5F5F1` | `60 16.7% 95.3%` | legacy off-white |
| `--white` | `#FFFFFF` | `0 0% 100%` | pure white |
| `--gold` | `#F59E0B` | `37.7 92.1% 50.2%` | rating / tonight |
| `--success` | `#10B981` | `160.1 84.1% 39.4%` | success |
| `--success-container` | `#06281E` | `162.4 73.9% 9%` | success tint |
| `--error-container` | `#3B070A` | `356.5 78.8% 12.9%` | error tint |
| `--error-container-foreground` | `#FCA5A5` | `0 93.5% 81.8%` | error tint text |
| `--radius` | — | `0.75rem` | base radius (not a color; not generated) |

Notes:

- Values in this section are **frozen** for TL-1…TL-5. They preserve what the app renders today; see `README.md` §1.1 for the four collision resolutions.
- `--secondary` is grey. The Paper red `#831010` and the MD3 `secondaryContainer` / `tertiaryContainer` / `onTertiaryContainer` values are deleted. They are currently used only inside `themeColors`, not by the UI.
- `--muted-foreground` stays at `#8E8E99` because reusables expects it. `--subtle-foreground` and `--faint-foreground` are the app's text levels; `visual-adaptation.md` VA-2 retires `muted-foreground` from screens.
- `--hairline` is white; alpha comes from the utility (`border-hairline/10`).

---

## 4. Migration map

### JS symbols

| Legacy | New | Notes |
|---|---|---|
| `palette.appBackground` | `colors.background` | #0C0C0E |
| `palette.obsidian` | `colors.surface1` | #121212 |
| `palette.charcoal` | `colors.surface2` | #141414 |
| `palette.surfaceCard` | `colors.card` | #161618 |
| `palette.zinc900` | `colors.surface4` | #181818 |
| `palette.zinc850` | `colors.surface5` | #1E1E1E |
| `palette.zinc800` | `colors.surface6` | #242424 |
| `palette.zinc750` | `colors.surface7` | #2A2A2A |
| `palette.zinc700` | `colors.surface8` | #333333 |
| `palette.cinemaRed` | `colors.primary` | #E50914 |
| `palette.cinemaRedHover` | `colors.primaryHover` | #B20710 |
| `palette.white` | `colors.white` | #FFFFFF |
| `palette.offWhite` | `colors.offWhite` | #F5F5F1 |
| `palette.zinc400` | `colors.subtleForeground` | #A1A1AA |
| `palette.zinc500` | `colors.faintForeground` | #71717A |
| `palette.gold` | `colors.gold` | #F59E0B |
| `palette.emerald` | `colors.success` | #10B981 |
| `palette.error` | `colors.destructive` | #EF4444 |
| `palette.errorContainer` | `colors.errorContainer` | #3B070A |
| `palette.onErrorContainer` | `colors.errorContainerForeground` | #FCA5A5 |
| `themeColors.primary` | `colors.primary` | — |
| `themeColors.textMuted` | `colors.faintForeground` | #71717A |
| `themeColors.textSecondary` | `colors.subtleForeground` | #A1A1AA |
| `themeColors.textPrimary` | `colors.white` | preserve #FFFFFF |
| `themeColors.background` | `colors.surface1` | preserve #121212; visual may unify later |
| `themeColors.onSurface` | `colors.offWhite` | preserve #F5F5F1 |
| `themeColors.elevation.level2` | `colors.surface5` | #1E1E1E |
| `themeColors.gold` | `colors.gold` | — |
| `themeColors.success` | `colors.success` | — |
| `themeColors.error` | `colors.destructive` | — |

Deleted with no replacement: `palette.secondary`, `palette.secondaryContainer`, `palette.tertiaryContainer`, `palette.onTertiaryContainer`, `palette.cinemaRedMuted`, `palette.glassBorder`, `palette.glassBorderMedium`, `palette.glassSurface`, `palette.glassSurfaceHover`, `themeColors.secondary`, `themeColors.secondaryContainer`, `themeColors.tertiaryContainer`, `themeColors.onTertiaryContainer`, `themeColors.surfaceDisabled`, `themeColors.onSurfaceDisabled`, `themeColors.backdrop`, `themeColors.inverse*`. Verify with grep before deleting; they should only appear in `lib/theme/colors.ts`.

### Classes

Rename the token fragment and keep prefix/opacity suffix:

| Legacy | New | Value |
|---|---|---|
| `surface-obsidian` | `surface-1` | #121212 |
| `surface-charcoal` | `surface-2` | #141414 |
| `surface-zinc-900` | `surface-4` | #181818 |
| `surface-zinc-850` | `surface-5` | #1E1E1E |
| `surface-zinc-800` | `surface-6` | #242424 |
| `surface-zinc-750` | `surface-7` | #2A2A2A |
| `surface-zinc-700` | `surface-8` | #333333 |
| `surface-brand` | `brand-surface` | #201012 |
| `surface-danger` | `danger-surface` | #200E10 |
| `text-surface-obsidian` | `text-surface-1` | #121212 |
| `text-off-white` | `text-off-white` | keep until `visual-adaptation.md` |
| `text-error-container` | `text-error-container` | **bug**: it is a background token used as text; fix in `visual-adaptation.md` |

`bg-card`, `bg-background`, `bg-primary`, `bg-primary-hover`, `text-foreground`, `text-muted-foreground`, `border-input`, etc. already match the contract and are unchanged.

---

## 5. Phases

### TL-0 · Baseline and contract

- [ ] Create a branch/worktree for the token migration.
- [ ] Capture baseline screenshots: welcome, login, check-email, onboarding step 1/5, Today, Showtime, Journal, Profile, movie detail, all three dialogs.
- [ ] Re-read §3 and §4. They are approved and locked in `README.md` §1.1; do not renegotiate values.
- [ ] Do not change code in this phase.

**Gate:** tree clean before the first phase commit; baseline screenshots stored; `git diff` empty.

### TL-1 · Expand `global.css` and `tailwind.config.js`

- [ ] Rewrite `global.css` `:root` with the §3 contract.
- [ ] Add the new utilities to `tailwind.config.js`.
- [ ] Keep the old utilities as **deprecated aliases** pointing at the new variables (`surface-zinc-*`, `surface-obsidian`, `surface-charcoal`, `off-white`, `error-container`).
- [ ] Remove `darkMode: "media"`; the app is dark-only and defines values in `:root`. There are zero `dark:` classes, so behavior does not change.
- [ ] Keep `--radius` and the existing radius mappings.
- [ ] Do not change `fontFamily` / `fontSize`; typography owns those.

**Gate:** NativeWind/Tailwind build succeeds; `eslint-plugin-tailwindcss` passes; screenshots identical.

### TL-2 · Generator and generated TS

- [ ] Add `scripts/gen-tokens.mjs` (PostCSS, not regex).
- [ ] Parse `global.css`, extract `--name: h s% l%`, convert HSL → hex.
- [ ] Emit `lib/theme/tokens.generated.ts` with an `AUTO-GENERATED` header and `as const`.
- [ ] Support `--check` (exit 1 when the committed file is stale).
- [ ] Add `scripts/gen-tokens.test.mjs` using `node:test`:
  - known HSL → hex cases;
  - a temp CSS change makes `--check` fail.
- [ ] Add scripts: `tokens:generate`, `tokens:check`, update `styles:check`.
- [ ] Commit the generated file.

**Gate:** `node --test scripts/gen-tokens.test.mjs`; `node scripts/gen-tokens.mjs --check`; `tsc`.

### TL-3 · Migrate JS consumers

- [ ] Replace `theme.colors.*` using the §4 map in the 14 files that call `useAppTheme()`.
- [ ] Replace `palette.*` in the 35 consumer files.
- [ ] Update `lib/theme/navigation.ts`, `lib/theme/toast-config.tsx`, `app/_layout.tsx`, `app/(app)/_layout.tsx` to read from `tokens.generated.ts`.
- [ ] Remove `AppThemeContext.Provider` and `glimpseDarkTheme` from `app/_layout.tsx`.
- [ ] Remove `const theme = useAppTheme()` and unused imports.
- [ ] Use a mapping-driven script with `--dry-run` for the repetitive renames; review the diff.

**Gate:** no `useAppTheme`, `theme.colors`, or `palette.` outside `lib/theme`; `tsc`; screenshots identical.

### TL-4 · Migrate className consumers

- [ ] Rename only the surface/brand/danger tokens from §4 in `.tsx` files.
- [ ] Preserve prefixes and opacity suffixes (`bg-`, `text-`, `border-`, `/95`).
- [ ] Do not touch `text-white`, `text-zinc-*`, or `border-white/[0.08]`; those are visual decisions.

**Gate:** `grep -rn "surface-zinc\|surface-obsidian\|surface-charcoal" app components features` is empty; ESLint; screenshots identical.

### TL-5 · Contract: delete the legacy layer

- [ ] Delete `lib/theme/palette.json`.
- [ ] Delete `themeColors`, `palette`, `glimpseDarkTheme`, `AppThemeContext`, `useAppTheme`, `netflixTheme`.
- [ ] Reduce `lib/theme/index.ts` to surviving exports only.
- [ ] Delete `scripts/check-tokens.mjs`.
- [ ] Remove deprecated aliases from `global.css` and `tailwind.config.js`.
- [ ] **Do not delete** `themeFonts` / `typeClasses` / `fonts`; `typography.md` owns them.

**Gate:** legacy-symbol grep is empty; `tsc`, `eslint`, `tokens:check`, `check-classnames` pass.

### TL-6 · Enforce and document

- [ ] Add `tokens:check` and `styles:check` to `.github/workflows/ci.yaml`.
- [ ] Do not expand the global lint scope here; `dependency-lockfile-hygiene.md` DH-4 owns it.
- [ ] Add `scripts/check-no-legacy-tokens.mjs` (or ESLint `no-restricted-imports`) forbidding:
  `@/lib/theme/colors`, `palette.json`, `useAppTheme`, `themeColors`, `AppThemeContext`.
- [ ] Convert `app.json` → `app.config.ts` (or add a check) so splash/adaptive-icon backgrounds use `colors.background`.
- [ ] Link this file from `AGENT.md`.

**Gate:** a deliberate CSS value change makes CI fail; revert.

---

## 6. Verification

Run from `app/`:

```bash
npx tsc --noEmit
npx eslint app components features lib
node scripts/gen-tokens.mjs --check
node scripts/check-classnames.mjs
node --test scripts/gen-tokens.test.mjs
```

Grep gates:

```bash
grep -rn "useAppTheme\|themeColors\|AppThemeContext\|glimpseDarkTheme\|netflixTheme\|palette\.json\|theme\.colors\." app components features lib
grep -rn "surface-zinc\|surface-obsidian\|surface-charcoal" app components features
```

Both must return nothing (except the grep command itself).

---

## 7. Do not

- Do not keep `palette.json` and `global.css` as two hand-maintained sources.
- Do not generate CSS from TS and TS from CSS (circular).
- Do not run a blind find/replace without the §4 map.
- Do not mix visual value changes into TL-1…TL-5.
- Do not delete the old layer before TL-3 and TL-4 are complete.
- Do not add new raw shade utilities (`surface-zinc-*`) to make a screen work.
- Do not hand-edit `tokens.generated.ts`.
- Do not upgrade NativeWind/Tailwind during this migration.

---

## 8. Definition of done

- `global.css` is the only place a color value is written.
- `tokens.generated.ts` is current and committed.
- `tailwind.config.js` contains no hex values.
- No `palette.json`, `themeColors`, `useAppTheme`, or `AppThemeContext`.
- No `surface-zinc-*` classes.
- `tokens:check` and `styles:check` run in CI.
- Screens are pixel-identical to the TL-0 baseline.
