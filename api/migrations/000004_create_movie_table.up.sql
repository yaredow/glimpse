CREATE TABLE IF NOT EXISTS movies (
    id                  BIGSERIAL PRIMARY KEY,
    tmdb_id             INT UNIQUE NOT NULL,
    imdb_id             TEXT UNIQUE,
    vague_description   TEXT NOT NULL,
    genres              TEXT[] NOT NULL,
    title               TEXT NOT NULL,
    original_title      TEXT,
    full_synopsis       TEXT,
    poster_path         TEXT,
    backdrop_path       TEXT,
    tagline             TEXT,
    director            TEXT,
    cast_members        JSONB,
    trailer_key         TEXT,
    release_date        DATE NOT NULL,
    runtime             INT,
    vote_average        NUMERIC(3, 1) NOT NULL,
    vote_count          INT,
    original_language   TEXT NOT NULL,
    spoken_languages    TEXT[],
    production_countries TEXT[],
    popularity          NUMERIC(10, 3) NOT NULL,
    shown_count         INT NOT NULL DEFAULT 0,
    watched_count       INT NOT NULL DEFAULT 0,
    global_watch_rate   DOUBLE PRECISION GENERATED ALWAYS AS (
        CASE WHEN shown_count = 0 THEN 0 ELSE watched_count::double precision / shown_count END
    ) STORED,
    detail_synced_at    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movies_popularity ON movies (popularity DESC);
CREATE INDEX idx_movies_genres ON movies USING GIN (genres);
