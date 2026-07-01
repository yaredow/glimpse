DROP TABLE IF EXISTS user_preferences;

ALTER TABLE users
    DROP COLUMN IF EXISTS total_interactions,
    DROP COLUMN IF EXISTS exploration_rate;
