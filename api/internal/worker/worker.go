// Package worker provides a worker that syncs popular movies from tmdb.
package worker

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/yaredow/glimpse-api/internal/repository/postgres"
	"github.com/yaredow/glimpse-api/internal/repository/tmdb"
)

type Worker struct {
	genreRepo    *postgres.GenreRepo
	movieRepo    *postgres.MovieRepo
	affinityRepo *postgres.AffinityRepo
	gridHistRepo *postgres.GridHistoryRepo
	tmdb         *tmdb.Client
	logger       *slog.Logger
	wg           sync.WaitGroup
	cancel       context.CancelFunc
}

func New(
	genreRepo *postgres.GenreRepo,
	movieRepo *postgres.MovieRepo,
	affinityRepo *postgres.AffinityRepo,
	gridHistRepo *postgres.GridHistoryRepo,
	tmdb *tmdb.Client,
	logger *slog.Logger,
) *Worker {
	return &Worker{
		genreRepo:    genreRepo,
		movieRepo:    movieRepo,
		affinityRepo: affinityRepo,
		gridHistRepo: gridHistRepo,
		tmdb:         tmdb,
		logger:       logger,
	}
}

func (w *Worker) Start() {
	ctx, cancel := context.WithCancel(context.Background())
	w.cancel = cancel

	w.wg.Go(func() { w.runSyncloop(ctx) })
	w.wg.Go(func() { w.runDecayLoop(ctx) })
}

func (w *Worker) runSyncloop(ctx context.Context) {
	w.syncGenres(ctx)
	w.syncMovies(ctx)

	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			w.syncGenres(ctx)
			w.syncMovies(ctx)
		case <-ctx.Done():
			return
		}
	}
}

func (w *Worker) runDecayLoop(ctx context.Context) {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			w.decay(ctx)
		case <-ctx.Done():
			return
		}
	}
}

func (w *Worker) decay(ctx context.Context) {
	if err := w.affinityRepo.Decay(ctx); err != nil {
		w.logger.Error("decay affinities failed", "error", err)
		return
	}

	if err := w.gridHistRepo.CleanupOld(ctx); err != nil {
		w.logger.Error("clean up grid history failed", "error", err)
		return
	}

	w.logger.Info("nightly decay complete")
}

func (w *Worker) Stop() {
	w.cancel()
	w.wg.Wait()
}
