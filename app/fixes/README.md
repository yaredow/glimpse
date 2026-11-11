# Design System Fixes — Index

**Status:** decisions locked. Execute top to bottom.
**Base branch:** `master` (default). `glimpse-revamp` merges into it first.
**Prerequisite:** the working tree must be clean before starting (see §2).

| Order | File | PR | First phase | Last phase |
|---|---|---|---|---|
| 1 | `dependency-lockfile-hygiene.md` | `chore/dependency-hygiene` | DH-0 | DH-3, DH-5 |
| 2 | `token-layer.md` | `refactor/token-layer` | TL-0 | TL-6 |
| 3 | `typography.md` | `refactor/typography` | TY-0 | TY-5 |
| 4 | `visual-adaptation.md` | `refactor/visual-adaptation` | VA-0 | VA-6, DH-4 |

---

## 1. Locked decisions

### 1.1 Token values: preserve pixels, change values later

The token migration is **mechanical and pixel-identical**. Every color that a screen renders today keeps the exact same value after `token-layer.md` and `typography.md`. Actual color consolidation happens only in `visual-adaptation.md` VA-2, as a separate reviewed PR with screenshot comparisons.

Why: the only cheap proof that a mechanical migration is safe is "the screenshots did not change". If values change in the same commit, every visual diff becomes ambiguous — you cannot tell a regression from an intended tweak, and `git bisect` stops working.

Where the four sources disagree, this is the resolution:

| Case | Today | Locked value | Reason |
|---|---|---|---|
| `background` | CSS `#0C0C0E`, `themeColors` `#121212` | CSS stays `#0C0C0E`; `themeColors.background` → `surface1` `#121212` | Each keeps what it renders today. Unify in VA-2. |
| `secondary` | CSS grey `#242428`, `themeColors` red `#831010` | grey `#242428`; red deleted | The red is defined but never used by the UI (verified: only `lib/theme/colors.ts`). |
| `border` | CSS opaque `#242428`, `themeColors` `rgba(255,255,255,0.08)` | `#242428` | `themeColors.border` is unused (verified). Translucent separators become `border-hairline/10`. |
| `muted-text` | `#8E8E99` vs `#A1A1AA` vs `#71717A` | all three kept as `muted-foreground`, `subtle-foreground`, `faint-foreground` | Different roles today; consolidation is a design decision for VA-2. |

Consolidation targets for VA-2 (not part of the mechanical phases):

- one canvas color: `#0C0C0E` (`bg-background`); `surface-1`/`surface-2` only for intentional insets;
- one text ramp: `#FAFAFA` → `#A1A1AA` → `#71717A`; `#FFFFFF` only for true-white emphasis (wordmark, button labels);
- collapse `#141414` / `#161618` / `#181818` onto `#161618` (`--card`), confirmed by the VA-2 screenshot review.

Do not start VA-2 early, and do not "fix" a value while doing a rename.

### 1.2 Delivery model: short-lived branch per PR

The default branch is **`master`**. `glimpse-revamp` is the migration baseline and must land on `master` first; all fix branches are cut from the updated `master`, one at a time.

```
master
├── PR 1  chore/dependency-hygiene
├── PR 2  refactor/token-layer        (cut after PR 1 merges)
├── PR 3  refactor/typography         (cut after PR 2 merges)
├── PR 4  refactor/visual-adaptation  (cut after PR 3 merges)
└── PR 5  chore/ci-coverage           (cut after PR 4 merges)
```

Rules:

1. **Baseline first.** Merge `glimpse-revamp` into `master` and confirm CI is green on both jobs. No fix branch starts before that. The pre-migration working tree is already committed: `074022d`, `20cc6df`, `9f7e048`, `522d9b5`.
2. **One branch, one PR, one doc.** Cut from the updated `master` — not from the previous feature branch — merge it, delete it, then cut the next. Branches never stay open in parallel.
3. **One commit per phase**, message prefixed with the phase id:
   `refactor(tokens): TL-1 expand css contract, keep aliases`.
   Each commit must pass its own **Gate** before the next phase starts.
4. **PR 2 and PR 3 are pixel-identical.** Only PR 4 may change what the user sees. If a screenshot in PR 2/3 differs, it is a bug.
5. **Shared files are sequenced, never parallelised:** `global.css` (PR 2), `tailwind.config.js` (PR 2, PR 3), `components/ui/text.tsx` (PR 3, PR 4). Finish and merge PR 2 before starting PR 3.
6. **DH-4 (CI expansion) is its own final PR**, because expanding lint to `app components features lib` will surface errors that the migrations are expected to remove. Doing it earlier would block every PR on pre-existing debt.
7. **No dependency upgrades** inside PR 2–5 except the ones listed in PR 1.

If a PR grows past ~40 changed files, split by phase into stacked PRs **within the same doc** — never across docs.

### 1.3 Scope boundary

| Concern | Owner |
|---|---|
| Color values, color tokens, token generation | `token-layer.md` |
| Font families, sizes, line heights, `Text` primitive | `typography.md` |
| Icons, spacing, radii, shadows, component bugs, a11y | `visual-adaptation.md` |
| Package manager, versions, CI plumbing | `dependency-lockfile-hygiene.md` |

If a fix does not fit one row, it belongs in `visual-adaptation.md` and waits.

---

## 2. Start here

```bash
# once, before anything else
git switch master
git pull
git merge --ff-only glimpse-revamp        # or merge the PR with rebase-and-merge
git push

# then, for each PR
git switch master && git pull
git switch -c chore/dependency-hygiene
```

Then open `dependency-lockfile-hygiene.md` and run DH-0.

`app/fix.md` was deleted; this directory replaces it. Do not recreate a single mega-register — add findings to the relevant phase file instead.
