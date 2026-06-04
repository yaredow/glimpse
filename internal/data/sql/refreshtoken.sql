-- name: CreateRefreshToken :exec
INSERT INTO refresh_tokens (hash, user_id, expires_at, family_id)
    VALUES ($1, $2, $3, $4);

-- name: GetRefreshToken :one
SELECT
    hash,
    user_id,
    expires_at,
    created_at,
    revoked_at,
    family_id,
    replaced_by_hash
FROM
    refresh_tokens
WHERE
    hash = $1;

-- name: RevokeRefreshToken :exec
UPDATE
    refresh_tokens
SET
    revoked_at = NOW()
WHERE
    hash = $1;

-- name: RevokeTokenFamily :exec
UPDATE
    refresh_tokens
SET
    revoked_at = NOW()
WHERE
    family_id = $1
    AND revoked_at IS NULL;

-- name: SetTokenReplacement :exec
UPDATE
    refresh_tokens
SET
    replaced_by_hash = $2
WHERE
    hash = $1;

-- name: DeleteExpiredRefreshTokens :exec
DELETE FROM refresh_tokens
WHERE expires_at < NOW()
    OR revoked_at IS NOT NULL;

