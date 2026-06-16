CREATE TABLE user_affinities (
    user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dimension          TEXT NOT NULL,
    value              TEXT NOT NULL,
    score              DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    confidence         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    last_updated       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, dimension, value)
);

CREATE INDEX idx_affinities_user_score ON user_affinities(user_id, score DESC);
