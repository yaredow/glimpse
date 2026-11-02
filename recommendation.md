# Glimpse — Product & UX Recommendations

> New ideas, product mechanics, and design direction. This is separate from `fixes.md`, which covers defects and risks.
>
> **Priority:** **P0** = core to the concept · **P1** = high demo/interview impact · **P2** = next iteration · **P3** = later
> **Effort:** S = < 1h · M = 1–3h · L = 3h+
>
> The guiding principle: **Glimpse is a commitment device for movie night, not a browsing app.** Every recommendation below either strengthens the ritual or removes friction from it.

---

## The design thesis

Decision fatigue is not solved by showing fewer movies alone. It is solved by:

1. **A finite deck** — five cards, no infinite scroll.
2. **A clear decision gate** — one revealed card must be resolved.
3. **Enough information to decide confidently** — not just a tagline.
4. **A cheap "no" and a deliberate "yes"** — passing is one tap; committing is a moment.
5. **A closed session** — the app ends with a feature or an empty deck. No doom loop.

The current app has the constraints but not the clarity. The recommendations below make the concept legible, tactile, and demo-friendly.

---

## Target loop

```
Open at night
  → "Tonight's program: [theme]"
  → Stack of 5 sealed cards
  → Top card: curator note + 3 clues + why it's here
  → Tap to reveal: poster, title, 2-line synopsis, trailer
  → Resolve: Pass / Seen it / Pick
  → Pick expands into Tonight's Feature
  → Change allowed until "Start tonight"
  → Start locks it in
  → Next day: verdict prompt
  → Journal + taste map update
  → New deck
```

If all five are passed: offer one reshuffle or "Let Glimpse choose." The session ends gracefully.

---

## R-01 · Replace the coverflow with a physical stack

- **Priority:** P0
- **Effort:** M
- **Problems solved:** The coverflow shows 3 cards + 5 dots, which says "compare many options." The forced-decision rule is currently enforced by a toast, which feels arbitrary.
- **Proposal:** Show one face-up card with the edges of the next four visible behind it. Only the top card is interactive. Resolving it (pass/seen/pick) slides it away and brings the next card forward.
- **Why it works:** The rule becomes structural. You cannot reach card 2 without resolving card 1 because the UI does not let you. No toast, no "Action Required." The deck metaphor also makes the five-card limit feel intentional.
- **Interaction details:**
  - Tap the sealed card to reveal (flip animation).
  - After reveal, three actions appear in a fixed bottom bar.
  - Pass/Seen: card gets a stamp and slides away. Optional 3-second undo.
  - Pick: card lifts out, the remaining deck fades, and the feature screen opens.
  - Show a small "2 of 5" progress indicator, not dots.
- **What to keep:** The flip animation, haptics, poster reveal, and the "reel" language. The stack is the same idea with a stronger metaphor.
- **Demo value:** High. It immediately communicates the product in one glance.
- **Risks:** Gesture ambiguity. Use buttons for actions; keep swipe gestures optional and always provide buttons for accessibility.
- **Related fixes:** F-11, F-12.

## R-02 · Replace the raw tagline with a curator note + structured clues

- **Priority:** P0
- **Effort:** M (content) + S (UI)
- **Problems solved:** The hidden-poster mechanic depends entirely on the pre-reveal clue. TMDB taglines are inconsistent, sometimes empty, and often generic. If the clue is bad, the game is bad.
- **Proposal:** Store a `curator_note` per movie: one short, non-spoiler line in the app's voice. Show it with three structured clues:
  - Genre
  - Decade
  - Runtime or rating band
  - One "why this is here" line from the engine
- **Examples:**
  - *"A slow-burn heist with almost no dialogue. 1990s. 118 min."*
  - *"A sun-bleached neo-noir about a bad decision. 2010s. 132 min."*
- **Content strategy:**
  - For the demo, hand-curate 30–50 movies.
  - For the catalog, generate notes offline from the synopsis and metadata, then review.
  - Keep title, cast, director, and poster hidden until reveal.
  - Use `vague_description` as a fallback, but not the raw TMDB tagline.
- **Why it works:** It preserves mystery while giving the user enough criteria to make a confident "no." The reveal becomes the payoff, not the only information.
- **Demo value:** Very high. This is the difference between "a card with a generic quote" and "a curated film club."
- **Related fixes:** F-15, F-23.

## R-03 · Make the daily deck a themed program

- **Priority:** P1
- **Effort:** M
- **Problems solved:** Five unrelated movies still require comparing genres, moods, and eras. The backend already has a mood taxonomy but only uses it on sync.
- **Proposal:** Generate the daily five around one vibe: "Tonight's program: Neon Noir," "Cold War paranoia," "Warm, weird, and hopeful." All five share the theme; the user chooses which version of the night they want.
- **Why it works:** It reduces the comparison set without reducing the number of cards. The choice becomes "which of these five noir films," not "which of these five random films." It also makes the deck feel curated rather than algorithmic.
- **Add one wildcard:** Four themed + one clearly marked wildcard preserves exploration. The wildcard can be the highest-exploration candidate.
- **Sync becomes meaningful:** "Draw a different program" instead of "reroll the slot machine." The mood taxonomy is already in `GetMoodFilter`; promote it to the daily generator.
- **Demo value:** High. A named program is memorable and easy to explain.
- **Risks:** Too narrow a theme can produce a weak deck. Define a minimum candidate count per theme and fall back to a broader theme if needed.
- **Related fixes:** F-15, F-24, F-25.

## R-04 · Add "Let Glimpse choose" (dealer's choice)

- **Priority:** P1
- **Effort:** S
- **Problems solved:** Some users are too indecisive to play the game. The app should have a pressure valve.
- **Proposal:** A button — always available, or after the first pass — that asks the engine to pick the best remaining card and take the user straight to the feature. Label it "Let Glimpse choose" or "Dealer's choice."
- **Why it works:** It is the purest expression of the product: the user does not want to decide, so the app decides. It is not a cop-out; it is the feature.
- **Interaction:** One tap → a brief shuffle animation → the chosen card reveals → feature screen. Offer a short "Change" window before Start.
- **Demo value:** Very high. It is a memorable five-second demo moment.
- **Risks:** Do not make it the default. It should feel like a trusted friend stepping in, not the app giving up on the game.
- **Related fixes:** F-10, F-12.

## R-05 · Adopt a three-action model, with the verdict after the feature

- **Priority:** P0
- **Effort:** M
- **Problems solved:** "Mark watched" currently means both "already seen" and "watched tonight," which pollutes affinity data and makes the Journal lie. `pick_tonight` and `watchlist_add` also duplicate intent.
- **Proposal:**
  - **Pick** — I want this tonight.
  - **Pass** — not tonight.
  - **Seen it** — I've already watched this; exclude it permanently.
  - **Start / lock in** — begin tonight's feature (the final commitment).
  - **Verdict** — next day: "How was it?" (1–5 stars or three simple options).
- **Why it works:** Each event has one meaning and one weight. The Journal only contains movies actually watched. The scorer learns from the outcome, not just the intent.
- **Data model implications:** See F-03 and F-13. Add `rating` and possibly `seen_before`; stop double-counting pick + lock-in + watched.
- **Demo value:** High. The Journal becomes trustworthy and the verdict loop closes the story.
- **Related fixes:** F-03, F-13, F-21.

## R-06 · Surface "Why this pick"

- **Priority:** P1
- **Effort:** M
- **Problems solved:** The engine is explainable but the UI never explains anything. Users cannot see why a movie is in their deck, and interviewers cannot see the engine working.
- **Proposal:** Add a `GET /v1/me/taste` endpoint returning the top affinities, and show one line on the sealed card and detail screen:
  - *"Because you keep choosing tense, 1990s crime films."*
  - *"A wildcard: you rarely watch animation."*
  - *"Because you loved three sci-fi films this month."*
- **Why it works:** It builds trust, gives the user a decision criterion, and turns the recommendation engine into a visible product feature. It is also a strong interview talking point.
- **Implementation:** Derive 2–3 top positive dimensions and one exploration reason. Keep the copy human, not numeric. Do not show raw scores.
- **Demo value:** Very high. It answers "why this movie?" before the interviewer asks.
- **Related fixes:** F-21.

## R-07 · Turn sync into a reshuffle bottom sheet

- **Priority:** P1
- **Effort:** M
- **Problems solved:** Sync is currently a dialog with horizontal mood chips. It is functional but not a highlight, and the mood taxonomy is buried.
- **Proposal:** A proper bottom sheet: "Reshuffle tonight's deck." Six mood cards in a 2×3 grid, each with an icon, a one-line description, and a subtle selected state. A primary "Draw five" button. Show "2 of 3 reshuffles left."
- **Why it works:** It matches the physical deck metaphor and makes the mood taxonomy a visible feature. It also gives the backend's `GetMoodFilter` a first-class UI.
- **Interaction:** Haptic on selection, a brief shuffle animation, then the new deck.
- **Demo value:** High. It is a natural second act in the demo.
- **Related fixes:** F-12.

## R-08 · Build a Taste Map, not just a profile

- **Priority:** P1
- **Effort:** M
- **Problems solved:** Profile is currently a settings page with fake toggles. The most interesting asset — the learned taste profile — is invisible.
- **Proposal:** A "Taste DNA" section with:
  - Top genres, languages, decades, rating bands (bars or chips).
  - "You've explored 7 genres this month."
  - "Your comfort zone: 1990s crime. Your growth edge: foreign-language drama."
  - A small "why" explanation for the top three.
- **Why it works:** It turns the affinity model into a visible progression system. It gives the user a reason to return beyond the nightly pick.
- **Demo value:** High. It is concrete evidence that the engine learns.
- **Related fixes:** F-09, F-17.

## R-09 · Make the Journal a film diary

- **Priority:** P2
- **Effort:** M
- **Problems solved:** The Journal is a poster grid with three stats. It works, but it does not yet feel like a record of a ritual.
- **Proposal:**
  - Group by month or week.
  - Show the verdict/rating.
  - Add a one-line note per film (optional).
  - Add a weekly recap: "This week: 3 features, 2 new genres, 1 wildcard."
  - Keep the poster grid as the main view; add a timeline toggle later.
- **Why it works:** The diary is the long-term retention loop. It also makes the verdict data meaningful.
- **Demo value:** Medium. It is the epilogue of the demo.
- **Related fixes:** F-03.

## R-10 · Gamify the ritual, not the casino

- **Priority:** P2
- **Effort:** M
- **Problems solved:** "Gamify" can easily become points, timers, and loss-aversion streaks. That would contradict the anti-doomscrolling promise.
- **Proposal:** Use progression, not pressure:
  - Nightly streak with a grace day. Never punitive.
  - Badges for exploration, not consumption: "First foreign-language feature," "Five nights in a row," "Wildcard chosen."
  - A weekly recap and a yearly "year in film" summary.
  - Deck completion: "5 of 5 resolved" — but do not punish an early pick.
  - The reveal animation and the feature screen are the immediate rewards.
- **Why it works:** It creates a sense of ritual and mastery without turning the app into a slot machine.
- **Do not build:** points, leaderboards, loot boxes, countdown pressure, "watch 100 movies" badges, social feeds.
- **Demo value:** Medium. Mention it as the retention vision; do not overbuild before the interview.

## R-11 · Define a "quiet cinema" design system

- **Priority:** P1
- **Effort:** L
- **Problems solved:** The app mixes a custom cinematic Today screen with default Paper forms, and uses red + gold + green at equal volume. Hardcoded hex values are everywhere.
- **Proposal:**
  - **Palette:** near-black `#0A0A0C`, warm off-white `#F2EFE9`, amber accent `#E3B15B`, muted zinc `#8B8B93`, success green only for transient states, red only for destructive/live states.
  - **Typography:** Inter for UI; one display weight for titles. Use tight tracking on headings, small caps only for metadata labels. Stop uppercasing everything.
  - **Spacing:** 4/8/12/16/24/32 scale. Use 16–20px screen padding, 14–20px card radii.
  - **Surfaces:** one card style, one border style, one shadow style. No mixed glass + paper + gradient cards.
  - **Motion:** one flip, one slide, one fade. Respect reduced motion.
- **Why it works:** Consistency is what makes the app feel designed rather than assembled. The palette should feel like a cinema program, not a streaming service.
- **Demo value:** High. The first 10 seconds of the demo are visual.
- **Related fixes:** F-28.

## R-12 · Make auth a brand moment

- **Priority:** P1
- **Effort:** M
- **Problems solved:** Login is the first screen and currently looks like a starter template.
- **Proposal:**
  - Logo + one-line pitch: "Five films. One night. No scrolling."
  - A single primary action ("Enter"), then the form.
  - Subtle background: a blurred film still or a grain gradient.
  - Keyboard avoidance, proper autofill, clear error states.
  - Keep registration to the minimum fields.
- **Why it works:** It sets the tone before the user sees the deck. It also gives the interviewer a coherent first impression.
- **Demo value:** High.
- **Related fixes:** F-18.

## R-13 · Turn onboarding into taste calibration

- **Priority:** P2
- **Effort:** M
- **Problems solved:** Onboarding is a four-step form. It works, but it feels like setup, not the start of a relationship.
- **Proposal:**
  - Frame each step as a calibration: "What are you drawn to?", "When do you want to live?", "How adventurous are you?"
  - Show a live "taste preview" that updates as they choose.
  - Keep four steps, but make the final screen a mini reveal: "Your starting taste map."
  - Make editing a separate, prefilled flow (F-09).
- **Why it works:** It sets expectations for the algorithm and makes the first deck feel earned.
- **Demo value:** Medium. The main demo can start after onboarding.

## R-14 · Add a demo mode with seeded state

- **Priority:** P1
- **Effort:** S
- **Problems solved:** A live demo depends on TMDB, a seeded catalog, a user with preferences, and a fresh daily deck. Any of those can fail on stage.
- **Proposal:** A `DEMO_MODE` flag or a seed command that:
  - Creates a demo user with known preferences and affinities.
  - Seeds 50–100 curated movies with posters, curator notes, and details already synced.
  - Generates a fresh deck for today with no lock-in.
  - Keeps the network path optional so the demo still works if TMDB is slow.
- **Why it works:** It removes the biggest demo risk. It also gives you a repeatable way to test the flow.
- **Demo value:** Very high. This is the difference between a demo and a live debugging session.
- **Related fixes:** F-06.

## R-15 · Add a graceful "Not tonight" exit and deck carryover

- **Priority:** P2
- **Effort:** S
- **Problems solved:** The forced-decision rule can trap the user. If they reveal a card and do not want any of the five, they must skip everything or close the app.
- **Proposal:** A "Not tonight" action that ends the session without marking a movie. Optionally carry the unresolved cards into tomorrow's deck (clearly labeled "3 left from last night").
- **Why it works:** It preserves the commitment device without making it a trap. The user can always choose not to decide.
- **Demo value:** Low, but it is important for real usage and for the "cheap no" principle.
- **Related fixes:** F-11.

## R-16 · Make availability region-aware

- **Priority:** P2
- **Effort:** S
- **Problems solved:** Watch providers are hardcoded to the US.
- **Proposal:** Add a region preference (default from device locale regex, fallback `US`). Pass it to TMDB. Show "not available in your region" clearly.
- **Why it works:** "Where to watch" is only useful if it is correct.
- **Related fixes:** F-22.

## R-17 · Accessibility and reduced motion

- **Priority:** P2
- **Effort:** S
- **Problems solved:** Some touch targets are under 44pt, muted text contrast is low, and the flip/shimmer animations have no reduced-motion path.
- **Proposal:**
  - Minimum 44×44 touch targets.
  - Contrast-check the secondary text against the background.
  - Respect `AccessibilityInfo.isReduceMotionEnabled` for flips, slides, and shimmer.
  - Add accessibility labels to cards, actions, and progress.
  - Ensure the deck can be operated entirely with buttons, not only gestures.
- **Why it works:** It makes the app usable for more people and is a mature engineering signal.
- **Demo value:** Low, but interviewers notice it.

## R-18 · Instrument the loop and define success metrics

- **Priority:** P2
- **Effort:** M
- **Problems solved:** There is no way to know whether the product hypothesis works.
- **Proposal:** Track:
  - Deck opens
  - Reveal rate (reveals per deck)
  - Resolution rate (revealed cards resolved)
  - Pass rate per card
  - Time to feature
  - Sync usage
  - Dealer's choice usage
  - Next-day return
  - Verdict completion
  - Feature completion (self-reported)
- **A/B tests to mention in the interview:**
  - 3 vs 5 cards
  - Tagline vs curator note
  - Forced decision vs free browsing
  - Themed vs random deck
  - 1 vs 3 syncs
- **Why it works:** It turns the project from "an app I built" into "a product hypothesis I tested."
- **Demo value:** High in conversation, low on screen.

## R-19 · Add caching and prefetching

- **Priority:** P2
- **Effort:** M
- **Problems solved:** Detail pages and sources hit external APIs on every open. The first deck after a sync can feel slow.
- **Proposal:**
  - Prefetch details for the five deck movies after generation (in the background, not blocking).
  - Cache watch providers and source results with a TTL.
  - Use `expo-image` blurhash/placeholder for posters.
  - Keep the skeleton loader but match the new stack shape.
- **Why it works:** Perceived speed is part of the ritual. The app should feel instant at night.
- **Related fixes:** F-02, F-33.

## R-20 · Interview narrative and demo script

- **Priority:** P1
- **Effort:** S
- **Not code — but this is the highest-leverage preparation.**

### One-sentence framing

> "I built a commitment device for movie night: five sealed films, one decision at a time, one feature per night."

### 60–90 second story

> "Glimpse is a daily five-movie picker, not an infinite catalog. The backend is Go, Echo, and Postgres. Every interaction — reveal, pass, seen, pick, start, verdict — is an immutable event. From those events I maintain affinities across genre, language, decade, and rating band. A deterministic scorer combines those affinities with popularity, freshness, and decaying exploration noise, then selects a themed deck. The UI intentionally limits you to five cards and three reshuffles so the product reduces choice instead of expanding it."

### Demo order

1. Open on Today. Show the stack and the theme.
2. Read the curator note and the "why this is here" line.
3. Reveal one card. Show the poster and the decision bar.
4. Pass one card (one tap, no dialog). Show the next card.
5. Pick a card. Show the feature screen.
6. Show "where to watch" (legal providers only).
7. Start / lock in.
8. Open the Journal and show the watched entry.
9. Show the taste map or the "why" explanation.
10. Optional: sync with a mood to show the reshuffle.

### Likely questions and answers

- **Why not ML?** Cold start, sparse data, explainability, deterministic debugging. The interaction log is the future training set.
- **How do you avoid a filter bubble?** Exploration noise decays with interaction count, freshness bonus, wildcard card, mood reshuffle.
- **How do you enforce the daily limit?** SQL-level sync guard inside the grid transaction; daily pool date; tomorrow's rollover.
- **What would you improve next?** Daily job for pool generation, background detail hydration, larger candidate generation, taste/why endpoint, verdict loop, experimentation.
- **Biggest tradeoff?** Deterministic and explainable over adaptive; move to learning-to-rank once there is enough interaction data.
- **What did you learn?** Constraining choice is a product decision, not just a UI one. The hard part is making the constrained choice feel fair.

### What not to demo

- Torrents/magnets.
- Fake notifications.
- Fake reminder toggles.
- The dirty work tree.
- A stale grid from a previous test session.

---

## Do not build (yet)

These would dilute the concept or create the wrong incentives:

- Infinite scroll or a full catalog browser.
- Points, leaderboards, or loot boxes.
- Countdown timers that pressure a decision.
- Loss-aversion streaks ("you'll lose your 12-day streak").
- Social feeds or public ratings.
- Fake notifications or fake settings.
- A second "discover" tab that reintroduces browsing.
- ML ranking before you have enough interaction data.

---

## Suggested phases

### Phase 0 — Make the concept true (before the interview)

- F-01 daily reset
- F-02 non-blocking TMDB
- F-03 rating persistence
- F-06 clean demo state
- R-01 stack deck
- R-02 curator note + clues
- R-05 three-action model
- R-14 demo mode

### Phase 1 — Make it feel designed

- R-06 why this pick
- R-07 sync bottom sheet
- R-11 quiet cinema design system
- R-12 auth brand moment
- F-18, F-28
- F-09 to F-13 client flow fixes

### Phase 2 — Make it a ritual

- R-03 themed program
- R-04 dealer's choice
- R-08 taste map
- R-09 film diary
- R-10 gentle gamification
- R-15 not tonight / carryover

### Phase 3 — Make it measurable

- R-16 region-aware availability
- R-17 accessibility
- R-18 instrumentation and A/B tests
- R-19 caching and prefetching
- F-35 CI, OpenAPI, E2E, observability

---

## The one-line product test

Before adding anything, ask:

> **Does this reduce the number of decisions, or improve the quality of the one decision that matters?**

If it increases optionality, it probably belongs in a later phase — or not at all.
