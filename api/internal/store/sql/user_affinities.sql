-- name: UpsertUserAffinity :exec
INSERT INTO user_affinities (
    user_id, dimension, value, score, confidence, last_updated
)
VALUES ($1, $2, $3, $4, 1, NOW())
ON CONFLICT (user_id, dimension, value) DO UPDATE SET
    score        = user_affinities.score + excluded.score,
    confidence   = user_affinities.confidence + 1,
    last_updated = NOW();

-- name: GetUserAffinities :many
SELECT * FROM user_affinities
WHERE user_id = $1;

-- name: DecayAffinies :exec
UPDATE user_affinities
SET score = score * 0.97;
