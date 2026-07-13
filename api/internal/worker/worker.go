package worker

import (
	"context"
	"log"
	"log/slog"
	"sync"
	"time"

	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/tmdb"
	"golang.org/x/sync/errgroup"
)

type movieRepo interface {
	UpsertBatchMovies(ctx context.Context, movies []*domain.Movie) error
	UpdateMovieDetail(ctx context.Context, tmdbID int, detail *domain.MovieDetailParams) error
}

type genreRepo interface {
	UpsertBatchGenres(ctx context.Context, genres []*domain.Genre) error
}

type affinityRepo interface {
	Decay(ctx context.Context) error
}

type gridHistoryRepo interface {
	CleanupOld(ctx context.Context) error
}

type Pool struct {
	wg *errgroup.Group
}

func New() *Pool {
	return &Pool{wg: &errgroup.Group{}}
}

func (p *Pool) Background(fn func()) {
	p.wg.Go(func() error {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("background panic: %v", err)
			}
		}()

		fn()
		return nil
	})
}

func (p *Pool) Wait() error {
	return p.wg.Wait()
}

type Worker struct {
	movieRepo    movieRepo
	genreRepo    genreRepo
	affinityRepo affinityRepo
	gridHistRepo gridHistoryRepo
	tmdb         *tmdb.Client
	logger       *slog.Logger
	wg           sync.WaitGroup
	cancel       context.CancelFunc
}

func NewWorker(
	movieRepo movieRepo,
	genreRepo genreRepo,
	affinityRepo affinityRepo,
	gridHistRepo gridHistoryRepo,
	tmdb *tmdb.Client,
	logger *slog.Logger,
) *Worker {
	return &Worker{
		movieRepo:    movieRepo,
		genreRepo:    genreRepo,
		affinityRepo: affinityRepo,
		gridHistRepo: gridHistRepo,
		tmdb:         tmdb,
		logger:       logger,
	}
}

func (w *Worker) Start() {
	ctx, cancel := context.WithCancel(context.Background())
	w.cancel = cancel

	w.wg.Add(1)
	go func() { w.runSyncLoop(ctx) }()

	w.wg.Add(1)
	go func() { w.runDecayLoop(ctx) }()
}

func (w *Worker) Stop() {
	w.cancel()
	w.wg.Wait()
}

func (w *Worker) runSyncLoop(ctx context.Context) {
	defer w.wg.Done()

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
	defer w.wg.Done()

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
