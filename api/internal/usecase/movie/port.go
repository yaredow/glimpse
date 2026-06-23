package movieusecase

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/entity"
)

type MovieFilterInput struct {
	FavoriteGenres []string
	ExcludedGenres []string
	Languages      []string
	MinRating      float64
	MinYear        int32
	MaxYear        int32
}

type MovieRepository interface {
	GetByID(ctx context.Context, id int64) (*entity.Movie, error)
	GetByTmdbID(ctx context.Context, tmdbID int32) (*entity.Movie, error)
	Upsert(ctx context.Context, movie *entity.Movie) error
	GetFilteredMovies(ctx context.Context, userID int64, input MovieFilterInput, limit int32) ([]*entity.Movie, error)
	GetCandidateMovies(ctx context.Context, userID int64, limit int32) ([]*entity.Movie, error)
	GetMoviesByGenre(ctx context.Context, genres []string, limit int32) ([]*entity.Movie, error)
}
