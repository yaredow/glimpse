package worker

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/tmdb"
)

type movieRepo interface {
	UpsertBatch(ctx context.Context, movies []*domain.Movie) error
}

type genreRepo interface {
	UpsertBatch(ctx context.Context, genres []*domain.Genre) error
}

type affinityRepo interface {
	Decay(ctx context.Context) error
}

type gridHistoryRepo interface {
	CleanupOld(ctx context.Context) error
}

type Worker struct {
	movieRepo movieRepo
	genreRepo genreRepo
	affinityRepo affinityRepo
	gridHistRepo gridHistoryRepo
	tmdb      *tmdb.Client
	logger    *slog.Logger
	wg        sync.WaitGroup
	cancel    context.CancelFunc
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

func (w *Worker) syncGenres(ctx context.Context) {
	w.logger.Info("syncing genres from tmdb")

	resp, err := w.tmdb.GetGenres(ctx)
	if err != nil {
		w.logger.Error("failed to fetch genres from tmdb", "error", err)
		return
	}

	genres := make([]*domain.Genre, len(resp.Genres))
	for i, g := range resp.Genres {
		genres[i] = &domain.Genre{
			ID:   g.ID,
			Name: g.Name,
		}
	}

	if err := w.genreRepo.UpsertBatch(ctx, genres); err != nil {
		w.logger.Error("failed to sync genres", "error", err)
		return
	}

	w.logger.Info("successfully synced genres", "count", len(genres))
}

func (w *Worker) syncMovies(ctx context.Context) {
	seen := make(map[int]tmdb.Movie)

	for page := 1; page <= 5; page++ {
		resp, err := w.tmdb.GetPopularMovies(ctx, page)
		if err != nil {
			w.logger.Error("sync movies: get popular", "page", page, "error", err)
			continue
		}

		for _, m := range resp.Results {
			seen[m.ID] = m
		}
	}

	for page := 1; page <= 5; page++ {
		resp, err := w.tmdb.GetTopRatedMovies(ctx, page)
		if err != nil {
			w.logger.Error("sync movies: get top rated", "page", page, "error", err)
			continue
		}

		for _, m := range resp.Results {
			seen[m.ID] = m
		}
	}

	w.logger.Info("syncing movies", "count", len(seen))

	movies := make([]*domain.Movie, 0, len(seen))
	for _, m := range seen {
		movies = append(movies, toDomainMovie(m))
	}

	if err := w.movieRepo.UpsertBatch(ctx, movies); err != nil {
		w.logger.Error("failed to sync movies", "error", err)
		return
	}

	w.logger.Info("successfully synced movies", "count", len(movies))
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
