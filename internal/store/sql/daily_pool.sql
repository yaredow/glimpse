-- name: GetUserGrid :many
SELECT
    dp.slot_number,
    dp.is_revealed,
    m.id AS movie_id,
    m.tmdb_id,
    m.vague_description,
    m.genres,
    dp.grid_session_id
FROM
    daily_pools AS dp
    INNER JOIN movies AS m ON dp.movie_id = m.id
WHERE
    dp.user_id = $1
    AND dp.assigned_at::date = CURRENT_DATE
ORDER BY
    dp.slot_number;

-- name: InsertGridSlot :exec
INSERT INTO daily_pools (user_id, movie_id, slot_number, grid_session_id)
    VALUES ($1, $2, $3, $4);

-- name: ClearUserGrid :exec
DELETE FROM daily_pools
WHERE user_id = $1;

