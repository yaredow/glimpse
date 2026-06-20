-- name: GetCandidateMovies :many
SELECT m.* FROM movies m
WHERE m.id NOT IN (
	SELECT movie_id FROM user_interactions
	WHERE user_interactions.user_id = $1 AND action IN ('watched', 'skipped')
	) AND (
		EXISTS (
			SELECT 1 FROM user_affinities a
			WHERE a.user_id = $1 AND a.dimension = 'genre'
				AND a.value = ANY(m.genres) AND a.score > 0
		)
		OR NOT EXISTS (SELECT 1 FROM user_affinities WHERE user_id = $1)
)
ORDER BY m.popularity DESC
LIMIT $2;
