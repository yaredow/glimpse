-- name: InsertGridHistory :exec
INSERT INTO user_grid_history (
    user_id, movie_id, shown_at
)
VALUES ($1, $2, NOW());

-- name: GetRecentlyShownMovies :many
SELECT
    movie_id,
    shown_at
FROM user_grid_history
WHERE user_id = $1
ORDER BY shown_at DESC
LIMIT $2;

-- name: CleanupOldGridHistory :exec
DELETE FROM user_grid_history
WHERE shown_at < NOW() - INTERVAL '30 days';
