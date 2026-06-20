CREATE TABLE user_grid_history (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id   BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    shown_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grid_history_user_time ON user_grid_history(user_id, shown_at DESC);
