DROP INDEX IF EXISTS idx_daily_pools_user_date;

ALTER TABLE daily_pools DROP COLUMN IF EXISTS pool_date;
