-- Reset the volatile nightly state for one demo user.
-- Keeps preferences, interactions, and affinities intact.
--
-- Usage:
--   psql "$DB_DSN" -v email='demo@example.com' -f scripts/reset_demo_state.sql

DELETE FROM daily_pools
WHERE user_id IN (
    SELECT id FROM users WHERE email = :'email'
);

DELETE FROM user_grid_history
WHERE user_id IN (
    SELECT id FROM users WHERE email = :'email'
);

UPDATE users
SET syncs_remaining = 3,
    skips_remaining = 3,
    activated = TRUE,
    last_reset_at = NOW(),
    updated_at = NOW()
WHERE email = :'email';
