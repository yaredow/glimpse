# Glimpse API

Go backend for a personalized movie recommendation service designed to eliminate decision fatigue.

The goal of Glimpse is to let users outsource movie discovery to an intelligent, lightweight engine that learns their taste dynamically and presents them with a curated daily selection, rather than an endless wall of choices.

---

## Core Philosophy

Instead of relying on heavy machine learning frameworks, Glimpse uses a deterministic, explainable scoring system based on multi-dimensional user affinities (genres, languages, decades, ratings) built directly into a Go and PostgreSQL stack.

- **Dynamic Learning:** Every user action—revealing a card, watching, skipping, or adding to a watchlist—is recorded as an active signal to continuously refine their taste profile.
- **Exploration & Variety:** The engine avoids the "filter bubble" trap by introducing controlled Gaussian noise (which decays as we learn more about the user) and enforcing genre diversity, ensuring recommendations remain fresh and surprising.
- **Explainable Scoring:** There are no "black box" decisions. Every recommendation's score can be decomposed into its contributing signals (affinity, popularity, freshness, and noise) for complete transparency.
- **Cold-Start Resilience:** Simple onboarding inputs seed initial taste profiles, which are rapidly calibrated and overtaken by real-time user interactions within just a few sessions.
- **Iterability:** By preserving an append-only, immutable history of user interactions, the system allows the affinity model and scoring weights to be recomputed and tuned retroactively.

---

## Tech Stack

- **Language:** Go
- **Database:** PostgreSQL
- **Data Source:** TMDB (The Movie Database) API integration for movie catalogs and metadata
