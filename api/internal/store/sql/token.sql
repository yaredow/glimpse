-- name: CreateToken :exec
INSERT INTO tokens (hash, user_id, expiry, scope)
VALUES ($1, $2, $3, $4);

-- name: GetUserByToken :one
SELECT
    u.id,
    u.username,
    u.email,
    u.password_hash,
    u.shuffles_remaining,
    u.last_shuffle_reset,
    u.exploration_rate,
    u.total_interactions,
    u.created_at,
    u.activated,
    u.version
FROM
    tokens AS t
INNER JOIN users AS u ON t.user_id = u.id
WHERE
    t.hash = $1
    AND t.scope = $2
    AND t.expiry > NOW();

-- name: DeleteTokensForUser :exec
DELETE FROM tokens
WHERE
    user_id = $1
    AND scope = $2;
