// Package worker provides a worker that syncs popular movies from tmdb.
package worker

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/yaredow/glimpse-api/internal/store"
	"github.com/yaredow/glimpse-api/internal/tmdb"
)

type Worker struct {
	store  *store.Store
	tmdb   *tmdb.Client
	logger *slog.Logger
	wg     sync.WaitGroup
	cancel context.CancelFunc
}

func New(store *store.Store, tmdb *tmdb.Client, logger *slog.Logger) *Worker {
	return &Worker{
		store:  store,
		tmdb:   tmdb,
		logger: logger,
	}
}

func (w *Worker) Start() {
	ctx, cancel := context.WithCancel(context.Background())
	w.cancel = cancel

	w.wg.Add(1)
	go func() {
		defer w.wg.Done()
		w.runSyncloop(ctx)
	}()
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

func (w *Worker) Stop() {
	w.cancel()
	w.wg.Wait()
}
