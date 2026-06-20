CREATE TABLE user_movies (
    user_id bigint REFERENCES users (id) ON DELETE CASCADE,
    movie_id bigint REFERENCES movies (id) ON DELETE CASCADE,
    status text NOT NULL, -- Must be: 'watched', 'watching', or 'skipped'
    updated_at timestamp with time zone NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX idx_user_movies_user_status ON user_movies (user_id, status);

