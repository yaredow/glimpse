-- name: UpsertGenre :exec
INSERT INTO genres (id, name)
VALUES ($1, $2)
ON CONFLICT (id) DO UPDATE
    SET name = excluded.name;

-- name: ListGenres :many
SELECT
    id,
    name
FROM genres
ORDER BY name ASC;
