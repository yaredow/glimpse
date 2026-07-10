CREATE TYPE action_type AS ENUM (
    'revealed', 'watched', 'skipped', 'watchlist_add'
);

CREATE TABLE user_interactions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id            BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    action              action_type NOT NULL,
    grid_session_id     UUID NOT NULL,
    grid_position       INT,
    reveal_to_action_ms INT,
    acted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_user_time  ON user_interactions(user_id, acted_at DESC);
CREATE INDEX idx_interactions_user_movie ON user_interactions(user_id, movie_id);

CREATE TABLE user_affinities (
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dimension     TEXT NOT NULL,
    value         TEXT NOT NULL,
    score         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    confidence    DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, dimension, value)
);

CREATE INDEX idx_affinities_user_score ON user_affinities(user_id, score DESC);

CREATE TABLE user_grid_history (
    id        BIGSERIAL PRIMARY KEY,
    user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id  BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    shown_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grid_history_user_time ON user_grid_history(user_id, shown_at DESC);
