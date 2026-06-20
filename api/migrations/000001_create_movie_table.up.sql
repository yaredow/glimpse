CREATE TABLE movies (
    id bigserial PRIMARY KEY,
    tmdb_id int UNIQUE NOT NULL,
    imdb_id text UNIQUE,
    -- Pre-reveal data
    vague_description text NOT NULL,
    genres text[] NOT NULL,
    -- Post-reveal data
    title text NOT NULL,
    original_title text NOT NULL,
    full_synopsis text NOT NULL,
    poster_path text,
    backdrop_path text,
    -- Movie metadata
    release_date date NOT NULL,
    runtime int NOT NULL,
    vote_average numeric(3, 1) NOT NULL,
    vote_count int NOT NULL DEFAULT 0,
    original_language text NOT NULL,
    -- Ranking and system tracking
    popularity numeric(10, 3) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movies_popularity ON movies (popularity DESC);

CREATE INDEX idx_movies_genres ON movies USING GIN (genres);

