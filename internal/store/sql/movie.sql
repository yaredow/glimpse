-- name: UpsertMovie :one
INSERT INTO movies (tmdb_id, imdb_id, vague_description, genres, title, original_title, full_synopsis, poster_path, backdrop_path, release_date, runtime, vote_average, vote_count, original_language, popularity)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
ON CONFLICT (tmdb_id) DO UPDATE SET
    popularity    = EXCLUDED.popularity,
    vote_average  = EXCLUDED.vote_average,
    vote_count    = EXCLUDED.vote_count,
    poster_path   = EXCLUDED.poster_path,
    backdrop_path = EXCLUDED.backdrop_path
RETURNING *;

-- name: GetMovieByID :one
SELECT
    *
FROM
    movies
WHERE
    id = $1;

-- name: GetMovieByTMDBID :one
SELECT
    *
FROM
    movies
WHERE
    tmdb_id = $1;

-- name: GetMoviesByGenre :many
SELECT
    *
FROM
    movies
WHERE
    $1 = ANY (genres)
ORDER BY
    popularity DESC
LIMIT $2;

-- name: UpdateMoviePopularity :one
UPDATE
    movies
SET
    popularity = $2
WHERE
    tmdb_id = $1
RETURNING
    *;

