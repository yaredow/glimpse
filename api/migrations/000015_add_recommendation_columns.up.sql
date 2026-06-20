ALTER TABLE users ADD COLUMN exploration_rate     DOUBLE PRECISION NOT NULL DEFAULT 0.4;
ALTER TABLE users ADD COLUMN total_interactions    INT NOT NULL DEFAULT 0;

ALTER TABLE movies ADD COLUMN shown_count    INT NOT NULL DEFAULT 0;
ALTER TABLE movies ADD COLUMN watched_count  INT NOT NULL DEFAULT 0;
ALTER TABLE movies ADD COLUMN global_watch_rate DOUBLE PRECISION GENERATED ALWAYS AS (
    CASE WHEN shown_count = 0 THEN 0 ELSE watched_count::double precision / shown_count END
) STORED;
