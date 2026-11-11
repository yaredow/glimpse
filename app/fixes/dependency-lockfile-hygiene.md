# Dependency & Lockfile Hygiene

**Status:** ready to implement — PR 1 of 5
**Owner:** unassigned
**Depends on:** clean working tree (`README.md` §2)
**Blocks:** nothing (run first so the tooling is stable)
**Scope:** package manager, dependency versions, unused packages, CI commands. No UI changes.

---

## 1. Current state

| Item | Fact | Action |
|---|---|---|
| Lockfiles | `bun.lock` is tracked; `package-lock.json` exists and is untracked | Bun is the source of truth; remove npm lockfile |
| CI install | `.github/workflows/ci.yaml` uses `bun install --frozen-lockfile` | keep Bun |
| `react-native-webview` | `package.json` has `13.15.0`; Expo SDK 58 bundled version is `14.0.1` | restore `14.0.1` |
| `@expo-google-fonts/inter` | installed, zero imports (the app uses Plus Jakarta Sans) | remove |
| `tailwindcss-animate` | installed, not in `tailwind.config.js` `plugins`, zero `animate-*` usage | remove |
| `expo-network` | used by `hooks/use-online-manager.ts` | keep |
| `@expo/vector-icons` | used by 16 files; `visual-adaptation.md` VA-1 removes it | remove only after VA-1 |
| `expo-symbols` | not installed (audit note is stale) | no action |
| `reset-project` script | points to `./scripts/reset-project.js`, which does not exist | remove the script or add the Expo template file |
| `app/fix.md` | 86 KB audit register | **deleted**; `app/fixes/*.md` replaces it |
| CI lint scope | mobile job lints only `features/movies` and `app/(app)` | expand to `app components features lib` |
| CI style checks | `tokens:check` / `styles:check` are not run | add after `token-layer.md` TL-6 |
| Package manager | `bun` is used in CI, but the dev environment may not have it | document Bun; do not run `npm install` in `app/` |

The `react-native-webview` downgrade happened in the migration commit. Treat it as a regression unless a concrete build reason is documented.

---

## 2. Phases

### DH-0 · Audit and decide

- [ ] Record the current versions of Expo, React Native, NativeWind, and Tailwind.
- [ ] Package manager (locked): **Bun only** in `app/`. Record it in `AGENT.md`.
- [ ] Check whether `react-native-webview@13.15.0` was pinned for a reason. Search the commit/PR description and CI logs. If no reason exists, restore the SDK version.
- [ ] Do not change dependencies yet.

**Gate:** decision recorded in the PR/commit or in `AGENT.md`.

### DH-1 · Lockfile

- [ ] Delete `app/package-lock.json`.
- [ ] Add `package-lock.json` to `app/.gitignore` so `npm install` cannot reintroduce it.
- [ ] Run `bun install` from `app/`.
- [ ] Commit the resulting `bun.lock`.
- [ ] Verify a clean install: `bun install --frozen-lockfile`.

**Gate:** only `bun.lock` remains; frozen install succeeds; CI install step still passes.

### DH-2 · Version and unused dependency fixes

- [ ] Restore the Expo-compatible webview:
  `bunx expo install react-native-webview`
  (expect `14.0.1`; confirm with `node -e "console.log(require('./node_modules/expo/bundledNativeModules.json')['react-native-webview'])"`).
- [ ] Remove `@expo-google-fonts/inter`.
- [ ] Remove `tailwindcss-animate` (locked: no `animate-*` usage and it is not registered). Do not leave it installed but inert.
- [ ] Defer `@expo/vector-icons` removal to `visual-adaptation.md` VA-1.
- [ ] Run `bunx expo-doctor` and resolve all reported issues.
- [ ] Run `bun x tsc --noEmit` and boot the app.

**Gate:** `expo-doctor` clean; app boots on iOS/Android; no unrelated dependency changes.

### DH-3 · Scripts and config

- [ ] Fix `package.json` `reset-project`: either restore the standard Expo `scripts/reset-project.js` or remove the script entry.
- [ ] Confirm `app/fix.md` stays deleted; do not recreate a single mega-register.
- [ ] Confirm `styles:check` and `tokens:check` exist and point at the new generator from `token-layer.md` TL-2.

  > `tokens:check` does not exist until PR 2 (TL-2). In PR 1, leave the script entry alone or gate it behind the PR order in `README.md` §1.2.
- [ ] Add a short “Package manager” section to `AGENT.md` (Bun, `bun install`, never `npm install` in `app/`).
- [ ] Link `app/fixes/*.md` from `AGENT.md`.

**Gate:** `bun run styles:check` passes; no dangling script paths. (`tokens:check` is added in PR 2 and only verified there.)

### DH-4 · CI (runs after `visual-adaptation.md`, PR 4)

`token-layer.md` TL-6 already adds `tokens:check` / `styles:check` to CI. Do not duplicate that here.

- [ ] Expand the mobile lint step to all app source:
  `bun x eslint app components features lib`.
- [ ] Keep `bun install --frozen-lockfile`.
- [ ] Ensure the CI job uses the committed `bun.lock` after DH-1/DH-2.
- [ ] Confirm the token/style checks added in TL-6 still run and are green.

**Gate:** CI is green; a deliberate token drift fails the job.

### DH-5 · Documentation

- [ ] Update `AGENT.md`:
  - Bun only;
  - `app/fixes/` is the implementation plan set;
  - token/typography/visual plans are the source of truth for styling work.
- [ ] Add a one-line note that `tokens.generated.ts` is generated and must not be edited.

**Gate:** docs merged; links resolve.

---

## 3. Verification

Run the full set after PR 4. In PR 1, run everything except `tokens:check` (it does not exist until TL-2).

```bash
cd app
bun install --frozen-lockfile
bun x tsc --noEmit
bun x eslint app components features lib
bun run tokens:check
bun run styles:check
bunx expo-doctor
```

If `bun` is unavailable locally, use `npx` only for the check commands and do **not** commit a generated `package-lock.json`.

---

## 4. Do not

- Do not keep two lockfiles.
- Do not run `npm install` in `app/`; it reintroduces `package-lock.json`.
- Do not downgrade `react-native-webview` without a documented Expo-compatibility reason.
- Do not remove `@expo/vector-icons` before `visual-adaptation.md` VA-1.
- Do not mix dependency changes with token/typography/visual commits.
- Do not leave unused dependencies installed “for later”.

---

## 5. Definition of done

- `bun.lock` is the only lockfile.
- `react-native-webview` matches the Expo SDK bundled version.
- Unused `@expo-google-fonts/inter` and `tailwindcss-animate` are gone (or `tailwindcss-animate` is actually registered).
- `expo-doctor` is clean.
- CI runs typecheck, full lint, `tokens:check`, and `styles:check`.
- `AGENT.md` documents Bun and the `app/fixes/` plans.
