CREATE TYPE action_type AS ENUM (
    'revealed', 'watched', 'skipped', 'watchlist_add'
);

CREATE TABLE user_interactions (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
	action action_type NOT NULL,
	grid_session_id UUID NOT NULL,
	grid_position INT,
	reveal_to_action_ms INT,
	acted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_user_time   ON user_interactions(user_id, acted_at DESC);
CREATE INDEX idx_interactions_user_movie  ON user_interactions(user_id, movie_id);
