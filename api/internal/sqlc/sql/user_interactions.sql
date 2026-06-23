-- name: InsertInteraction :exec
INSERT INTO user_interactions (
    user_id,
    movie_id,
    action,
    grid_session_id,
    grid_position,
    reveal_to_action_ms,
    acted_at
)
VALUES ($1, $2, $3, $4, $5, $6, NOW());

-- name: GetInteractionsForUser :many
SELECT * FROM user_interactions
WHERE user_id = $1
ORDER BY acted_at DESC
LIMIT $2;

-- name: GetUserActionedMovieIDs :many
SELECT DISTINCT movie_id FROM user_interactions
WHERE user_id = $1 AND action IN ('watched', 'skipped');

