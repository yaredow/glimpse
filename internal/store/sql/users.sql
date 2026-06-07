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
    created_at
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
    created_at
FROM
    users
WHERE
    id = $1;

-- name: UpdateUserShuffleReset :exec
UPDATE
    users
SET
    shuffles_remaining = 3,
    last_shuffle_reset = NOW()
WHERE
    id = $1;

