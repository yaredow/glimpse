-- name: UpsertPreference :one
INSERT INTO user_preferences (user_id, favorite_genres, excluded_genres, languages, min_rating, onboarded, min_year, max_year)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (user_id) DO UPDATE 
SET 
    favorite_genres = EXCLUDED.favorite_genres,
    excluded_genres = EXCLUDED.excluded_genres,
    languages = EXCLUDED.languages,
    min_rating = EXCLUDED.min_rating,
    onboarded = EXCLUDED.onboarded,
    min_year = EXCLUDED.min_year,
    max_year = EXCLUDED.max_year,
    updated_at = NOW()
RETURNING *;

-- name: GetUserPreference :one
SELECT * FROM user_preferences WHERE user_id = $1;

-- name: UpdateOnboardingStatus :exec
UPDATE user_preferences SET onboarded = $2, updated_at = NOW() WHERE user_id = $1;
