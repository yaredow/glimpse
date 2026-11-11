# Typography Consolidation

**Status:** ready to implement — runs after `token-layer.md` is merged
**Owner:** unassigned
**Depends on:** `token-layer.md` TL-5 merged (shares `tailwind.config.js`)
**Blocks:** `visual-adaptation.md` (needs the single `Text` primitive)
**Scope:** type ramp, font families, text primitives. Colors are `token-layer.md`.

---

## 1. Current state

| File / pattern | What it does | Problem |
|---|---|---|
| `lib/theme/typography.ts` → `fonts` | family-name map | fine as a map, but duplicated in Tailwind config |
| `lib/theme/typography.ts` → `typeClasses` | Tailwind class strings | second type ramp; used in 5 onboarding files |
| `lib/theme/typography.ts` → `themeFonts` | MD3 font objects | Paper-era; used only by `lib/theme/index.ts` and `navigation.ts` |
| `tailwind.config.js` → `fontFamily` | `font-brand`, `font-brandMedium`, … | correct native approach: one family per weight |
| `font-bold` / `font-semibold` | 16 occurrences in onboarding | sets `fontWeight` on a custom family; Android cannot satisfy it |
| `fontFamily:` literals | `auth-shell.tsx:164`, `brand-lockup.tsx:68` | bypasses the ramp |
| `text-[Npx]` | 243 occurrences in 38 files | no type ramp in practice |
| `Text` from `react-native` | 20 files import it | raw `Text` has no `font-brand`; renders the system font |

Concrete symptoms:

- `app/(auth)/welcome.tsx:50` — subtitle has no `font-brand` → system font.
- `app/(app)/movies/[id].tsx:201-252` — synopsis/metadata → system font.
- `features/onboarding/components/genre-selector.tsx:75-76` — `font-brand` + `font-bold` → wrong weight on Android.
- `components/ui/text.tsx` defaults to `font-brand text-base`, but most screens do not use it.

---

## 2. Target

- One type ramp in `tailwind.config.js`.
- One font-family source: `lib/theme/fonts.json`, imported by both Tailwind and TS.
- One `Text` primitive: `@/components/ui/text`.
- No `typeClasses`, `themeFonts`, `fontFamily:` literals, or `font-bold` / `font-semibold` / `font-medium` / `font-extrabold`.
- Arbitrary `text-[Npx]` reduced to documented exceptions over time.

Rules:

1. Each weight is its own family (`font-brandBold`). Never set `fontWeight` on a custom family.
2. Mechanical steps preserve current sizes. Ramp consolidation is a separate, reviewed change.
3. Do not create a second type ramp in TS.
4. Keep the reusables `Text` API (`variant`, `asChild`, `TextClassContext`) intact.

---

## 3. Proposed ramp

These values come from the existing `typeClasses` / `themeFonts`; they preserve current sizes.

| Tailwind token | Size | Line height | Letter spacing | Replaces |
|---|---|---|---|---|
| `text-label-sm` | `11px` | `16px` | `0.5px` | `typeClasses.labelSmall` |
| `text-label` | `14px` | `20px` | `0.1px` | `typeClasses.labelLarge` |
| `text-body-sm` | `12px` | `16px` | `0.4px` | `typeClasses.bodySmall` |
| `text-body` | `14px` | `20px` | `0.25px` | `typeClasses.bodyMedium`, `default` |
| `text-body-lg` | `16px` | `24px` | `0.5px` | `themeFonts.bodyLarge` |
| `text-title` | `16px` | `24px` | `0.15px` | `typeClasses.titleMedium` |
| `text-title-lg` | `22px` | `28px` | `0` | `themeFonts.titleLarge` |
| `text-headline` | `28px` | `36px` | `0` | `typeClasses.headlineMedium` |
| `text-display` | `57px` | `64px` | `0` | `typeClasses.displayLarge` |

`fontFamily` keys stay as they are: `brand`, `brandMedium`, `brandSemiBold`, `brandBold`, `brandExtraBold`.

---

## 4. Phases

### TY-0 · Baseline

- [ ] Capture screenshots of onboarding, auth, Today, Journal, Profile, movie detail.
- [ ] Record the current `typeClasses` and `themeFonts` values (table above).
- [ ] `text-base` / `text-sm` stay available as aliases during TY-1…TY-4 (locked); remove them in TY-5 after the sweep.

**Gate:** baseline screenshots stored; no code changes.

### TY-1 · One font source + Tailwind ramp

- [ ] Add `lib/theme/fonts.json`:

```json
{
  "regular": "PlusJakartaSans_400Regular",
  "medium": "PlusJakartaSans_500Medium",
  "semiBold": "PlusJakartaSans_600SemiBold",
  "bold": "PlusJakartaSans_700Bold",
  "extraBold": "PlusJakartaSans_800ExtraBold"
}
```

- [ ] In `tailwind.config.js`:

```js
const fontFamilies = require("./lib/theme/fonts.json");

fontFamily: {
  brand: [fontFamilies.regular],
  brandMedium: [fontFamilies.medium],
  brandSemiBold: [fontFamilies.semiBold],
  brandBold: [fontFamilies.bold],
  brandExtraBold: [fontFamilies.extraBold],
},
fontSize: {
  "label-sm": ["11px", { lineHeight: "16px", letterSpacing: "0.5px" }],
  "label": ["14px", { lineHeight: "20px", letterSpacing: "0.1px" }],
  "body-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.4px" }],
  "body": ["14px", { lineHeight: "20px", letterSpacing: "0.25px" }],
  "body-lg": ["16px", { lineHeight: "24px", letterSpacing: "0.5px" }],
  "title": ["16px", { lineHeight: "24px", letterSpacing: "0.15px" }],
  "title-lg": ["22px", { lineHeight: "28px", letterSpacing: "0" }],
  "headline": ["28px", { lineHeight: "36px", letterSpacing: "0" }],
  "display": ["57px", { lineHeight: "64px", letterSpacing: "0" }],
},
```

- [ ] Update `lib/theme/navigation.ts` to use `fontFamilies` from `fonts.json` instead of `themeFonts`.

**Gate:** Tailwind build, `eslint-plugin-tailwindcss`, screenshots identical.

### TY-2 · Onboarding migration (mechanical)

- [ ] Replace `typeClasses.*` in the 5 onboarding files with the equivalent `text-*` tokens.
- [ ] Replace `font-bold` / `font-semibold` / `font-medium` / `font-extrabold` with `font-brandBold` / `font-brandSemiBold` / `font-brandMedium` / `font-brandExtraBold`.
- [ ] Do not change sizes yet; use the exact equivalents.

**Gate:** no `typeClasses` or `font-bold`/`font-semibold` in `features/onboarding`; screenshots match intent (weights may become correct on Android, which is the fix).

### TY-3 · Single `Text` primitive

- [ ] Make `components/ui/text.tsx` the only text surface:
  - base: `font-brand text-body text-foreground`;
  - map `variant`s to the ramp (`h1` → `text-display font-brandExtraBold`, `h2` → `text-headline`, `h3` → `text-title-lg`, `h4` → `text-title`, `small` → `text-body-sm`, `muted` → `text-body-sm text-muted-foreground`, etc.);
  - keep `TextClassContext`.
- [ ] Migrate `Text` imports from `react-native` to `@/components/ui/text` in `app/`, `features/`, and `components/` (except `components/ui/text.tsx` and third-party wrappers that genuinely need RN `Text`).
- [ ] Add an ESLint `no-restricted-imports` rule for `Text` from `react-native` in those directories, with documented exceptions.

**Gate:** `grep -rn "Text } from \"react-native\"" app features components` returns only documented files; screenshots show one typeface.

### TY-4 · Remove the legacy typography layer

- [ ] Delete `typeClasses`, `themeFonts`, and the `fonts` export from `lib/theme/typography.ts`.
- [ ] Delete the file if it becomes empty; otherwise keep only `fontFamilies` (from `fonts.json`).
- [ ] Delete the two `fontFamily:` literals (`auth-shell.tsx`, `brand-lockup.tsx`) and use `fontFamilies` + `font-brand*`.
- [ ] Remove `themeFonts` imports from `lib/theme/index.ts` and `navigation.ts`.

**Gate:** `grep -rn "typeClasses\|themeFonts\|fontFamily:" app components features lib` is empty (except `fonts.json` / `tailwind.config.js`).

### TY-5 · Sweep arbitrary sizes (non-blocking)

- [ ] Replace `text-[Npx]` with the nearest ramp token, screen by screen.
- [ ] Keep a documented exception list for intentional one-offs (e.g., logo wordmark, display numbers).
- [ ] Target: no `text-[Npx]` in `app/`, `features/`, `components/` except the exception list.

**Gate:** `grep -rho "text-\[[0-9.]*px\]" app components features | wc -l` is at or below the documented exception count.

---

## 5. Verification

```bash
npx tsc --noEmit
npx eslint app components features lib
grep -rn "typeClasses\|themeFonts\|fontFamily:" app components features lib
grep -rn "font-bold\|font-semibold\|font-medium\|font-extrabold" app components features
grep -rn "Text } from \"react-native\"" app components features
```

All greps except the documented exception lists must be empty.

Device check: Plus Jakarta Sans renders at every weight on Android; no system-font fallback on the sampled screens.

---

## 6. Do not

- Do not set `fontWeight` on `font-brand*`; switch the family instead.
- Do not create a second ramp in TS (`themeFonts`, a new `typeClasses`).
- Do not delete `themeFonts` before TY-4.
- Do not mix a visual type redesign into TY-1…TY-4; use TY-5.
- Do not silently leave raw RN `Text` in screens.

---

## 7. Definition of done

- One type ramp in Tailwind.
- One `Text` primitive.
- `fonts.json` is the only font-family source.
- No `typeClasses`, `themeFonts`, `font-bold`, or `fontFamily:` literals.
- Android renders the intended weights.
