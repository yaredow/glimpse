CREATE TABLE IF NOT EXISTS user_preferences (
    user_id bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    favorite_genres integer[] NOT NULL DEFAULT '{}',
    excluded_genres integer[] NOT NULL DEFAULT '{}',
    languages text[] NOT NULL DEFAULT '{"en"}',
    min_rating numeric(3, 1) NOT NULL DEFAULT 0.0,
    onboarded boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Index for checking onboarding status
CREATE INDEX idx_user_preferences_onboarded ON user_preferences (onboarded);
