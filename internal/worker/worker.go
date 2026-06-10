// Package worker provides a worker that syncs popular movies from tmdb.
package worker

import (
	"context"
	"log/slog"
	"sync"

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

	w.wg.Add(2)
	go func() {
		defer w.wg.Done()
		w.syncGenres(ctx)
	}()
	go func() {
		defer w.wg.Done()
		w.syncMovies(ctx)
	}()
}

func (w *Worker) Stop() {
	w.cancel()
	w.wg.Wait()
}
