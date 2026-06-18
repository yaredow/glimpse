CREATE TABLE user_movies (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id   BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    status     TEXT NOT NULL DEFAULT 'watchlist',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, movie_id)
);

CREATE INDEX idx_user_movies_user_status ON user_movies (user_id, status);
