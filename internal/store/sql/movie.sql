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

-- name: GetFilteredMovies :many
SELECT
    *
FROM
    movies
WHERE
    (cardinality(sqlc.arg('favorite_genres')::text[]) = 0 OR genres && sqlc.arg('favorite_genres')::text[])
    AND NOT genres && sqlc.arg('excluded_genres')::text[]
    AND (cardinality(sqlc.arg('languages')::text[]) = 0 OR original_language = ANY (sqlc.arg('languages')::text[]))
    AND vote_average >= sqlc.arg('min_rating')
    AND EXTRACT(YEAR FROM release_date) BETWEEN sqlc.arg('min_year')::int AND sqlc.arg('max_year')::int
    AND id NOT IN (
        SELECT movie_id FROM user_movies WHERE user_id = sqlc.arg('user_id')
    )
ORDER BY
    popularity DESC
LIMIT sqlc.arg('limit');

