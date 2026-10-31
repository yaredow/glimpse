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
	syncer    DetailSyncer
}

func NewMovieService(movieRepo MovieRepo, watcher Watcher, syncer ...DetailSyncer) *MovieService {
	var s DetailSyncer
	if len(syncer) > 0 {
		s = syncer[0]
	}
	return &MovieService{movieRepo: movieRepo, watcher: watcher, syncer: s}
}

func (ms *MovieService) GetByID(ctx context.Context, userID, movieID int64) (*domain.Movie, error) {
	movie, err := ms.movieRepo.GetByID(ctx, movieID)
	if err != nil {
		return nil, fmt.Errorf("get movie: %w", err)
	}

	// Auto-sync movie details from TMDB if not yet synced
	if movie.DetailSyncedAt == nil && ms.syncer != nil {
		if err := ms.syncer(ctx, movie.TmdbID); err == nil {
			if updated, err := ms.movieRepo.GetByID(ctx, movieID); err == nil {
				movie = updated
			}
		}
	}

	watched, err := ms.watcher.HasWatched(ctx, userID, movieID)
	if err != nil {
		watched = false
	}
	movie.IsWatched = watched

	return movie, nil
}
