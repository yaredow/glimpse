ALTER TABLE daily_pools ADD COLUMN pool_date DATE;

-- Backfill from when the slot was assigned so old grids are not treated as today's.
UPDATE daily_pools SET pool_date = assigned_at::date;

ALTER TABLE daily_pools ALTER COLUMN pool_date SET DEFAULT CURRENT_DATE;
ALTER TABLE daily_pools ALTER COLUMN pool_date SET NOT NULL;

CREATE INDEX idx_daily_pools_user_date ON daily_pools (user_id, pool_date);
