-- name: CreateUser :one
INSERT INTO users (username, email, password_hash)
VALUES ($1, $2, $3)
RETURNING
    id, username, email, created_at;

-- name: GetUserByEmail :one
SELECT
    id,
    username,
    email,
    password_hash,
    shuffles_remaining,
    last_shuffle_reset,
    exploration_rate,
    total_interactions,
    created_at,
    activated,
    version
FROM
    users
WHERE
    email = $1;

-- name: GetUserById :one
SELECT
    id,
    username,
    email,
    password_hash,
    shuffles_remaining,
    last_shuffle_reset,
    exploration_rate,
    total_interactions,
    created_at,
    activated,
    version
FROM
    users
WHERE
    id = $1;

-- name: UpdateUser :one
UPDATE
    users
SET
    username = $2,
    email = $3,
    password_hash = $4,
    activated = $5,
    version = version + 1
WHERE
    id = $1 AND version = $6
RETURNING
    id, username, email, password_hash, shuffles_remaining, last_shuffle_reset, created_at, activated, version;

-- name: UpdateUserShuffleReset :exec
UPDATE
    users
SET
    shuffles_remaining = 3,
    last_shuffle_reset = NOW()
WHERE
    id = $1;
