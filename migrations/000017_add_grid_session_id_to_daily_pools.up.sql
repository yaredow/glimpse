CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE daily_pools
    ADD COLUMN grid_session_id uuid;

WITH sessions AS (
    SELECT
        user_id,
        assigned_at::date AS grid_date,
        gen_random_uuid () AS grid_session_id
    FROM
        daily_pools
    GROUP BY
        user_id,
        assigned_at::date)
UPDATE
    daily_pools AS dp
SET
    grid_session_id = sessions.grid_session_id
FROM
    sessions
WHERE
    dp.user_id = sessions.user_id
    AND dp.assigned_at::date = sessions.grid_date
    AND dp.grid_session_id IS NULL;

ALTER TABLE daily_pools
    ALTER COLUMN grid_session_id SET NOT NULL;

