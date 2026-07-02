ALTER TABLE users
    ADD COLUMN exploration_rate   DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    ADD COLUMN total_interactions INT NOT NULL DEFAULT 0;

CREATE TABLE user_preferences (
    user_id         BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    favorite_genres INTEGER[] NOT NULL DEFAULT '{}',
    excluded_genres INTEGER[] NOT NULL DEFAULT '{}',
    languages       TEXT[] NOT NULL DEFAULT '{en}',
    min_rating      NUMERIC(3, 1) NOT NULL DEFAULT 0.0,
    min_year        INT NOT NULL DEFAULT 1888,
    max_year        INT NOT NULL DEFAULT 2100,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
