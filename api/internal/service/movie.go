package service

import (
	"context"
	"fmt"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type MovieRepo interface {
	GetByID(ctx context.Context, movieID int64) (*domain.Movie, error)
}

type Watcher interface {
	HasWatched(ctx context.Context, userID, movieID int64) (bool, error)
}

type MovieService struct {
	movieRepo MovieRepo
	watcher   Watcher
}

func NewMovieService(movieRepo MovieRepo, watcher Watcher) *MovieService {
	return &MovieService{movieRepo: movieRepo, watcher: watcher}
}

func (ms *MovieService) GetByID(ctx context.Context, userID, movieID int64) (*domain.Movie, error) {
	movie, err := ms.movieRepo.GetByID(ctx, movieID)
	if err != nil {
		return nil, fmt.Errorf("get movie: %w", err)
	}

	watched, err := ms.watcher.HasWatched(ctx, userID, movieID)
	if err != nil {
		watched = false
	}
	movie.IsWatched = watched

	return movie, nil
}
