ALTER TABLE users DROP COLUMN IF EXISTS exploration_rate;
ALTER TABLE users DROP COLUMN IF EXISTS total_interactions;

ALTER TABLE movies DROP COLUMN IF EXISTS global_watch_rate;
ALTER TABLE movies DROP COLUMN IF EXISTS watched_count;
ALTER TABLE movies DROP COLUMN IF EXISTS shown_count;
