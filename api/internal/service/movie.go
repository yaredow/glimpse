package service

import (
	"context"
	"fmt"
	"net/url"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type MovieRepo interface {
	GetByID(ctx context.Context, movieID int64) (*domain.Movie, error)
}

type Watcher interface {
	HasWatched(ctx context.Context, userID, movieID int64) (bool, error)
}

type ProviderFetcher interface {
	GetWatchProviders(ctx context.Context, tmdbID int) (*domain.WatchProvidersResult, error)
}

type TorrentSearcher interface {
	SearchTorrents(ctx context.Context, imdbID, movieTitle string) ([]domain.TorrentSource, error)
}

type ReviewFetcher interface {
	GetMovieReviews(ctx context.Context, tmdbID int) ([]domain.MovieReview, error)
}

type MovieService struct {
	movieRepo       MovieRepo
	watcher         Watcher
	syncer          DetailSyncer
	providers       ProviderFetcher
	torrentSearcher TorrentSearcher
	reviewFetcher   ReviewFetcher
}

func NewMovieService(movieRepo MovieRepo, watcher Watcher, syncer ...DetailSyncer) *MovieService {
	var s DetailSyncer
	if len(syncer) > 0 {
		s = syncer[0]
	}
	return &MovieService{movieRepo: movieRepo, watcher: watcher, syncer: s}
}

func (ms *MovieService) WithSources(providers ProviderFetcher, torrents TorrentSearcher) *MovieService {
	ms.providers = providers
	ms.torrentSearcher = torrents
	return ms
}

func (ms *MovieService) WithReviews(reviews ReviewFetcher) *MovieService {
	ms.reviewFetcher = reviews
	return ms
}

func (ms *MovieService) GetByID(ctx context.Context, userID, movieID int64) (*domain.Movie, error) {
	movie, err := ms.movieRepo.GetByID(ctx, movieID)
	if err != nil {
		return nil, fmt.Errorf("get movie: %w", err)
	}

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

func (ms *MovieService) GetSources(ctx context.Context, movieID int64) (*domain.MovieSourcesResponse, error) {
	movie, err := ms.movieRepo.GetByID(ctx, movieID)
	if err != nil {
		return nil, fmt.Errorf("get movie: %w", err)
	}

	imdbID := ""
	if movie.ImdbID != nil {
		imdbID = *movie.ImdbID
	}

	res := &domain.MovieSourcesResponse{
		MovieID:     movie.ID,
		Title:       movie.Title,
		ImdbID:      imdbID,
		TmdbID:      movie.TmdbID,
		Torrents:    []domain.TorrentSource{},
		SearchLinks: buildSearchLinks(movie.Title, imdbID),
	}

	if ms.providers != nil && movie.TmdbID > 0 {
		if provs, err := ms.providers.GetWatchProviders(ctx, movie.TmdbID); err == nil {
			res.Providers = provs
		}
	}

	if ms.torrentSearcher != nil {
		if torrents, err := ms.torrentSearcher.SearchTorrents(ctx, imdbID, movie.Title); err == nil {
			res.Torrents = torrents
		}
	}

	return res, nil
}

func (ms *MovieService) GetReviews(ctx context.Context, movieID int64) (*domain.MovieReviewsResponse, error) {
	movie, err := ms.movieRepo.GetByID(ctx, movieID)
	if err != nil {
		return nil, fmt.Errorf("get movie: %w", err)
	}

	res := &domain.MovieReviewsResponse{
		MovieID: movie.ID,
		Reviews: []domain.MovieReview{},
	}

	if ms.reviewFetcher != nil && movie.TmdbID > 0 {
		if revs, err := ms.reviewFetcher.GetMovieReviews(ctx, movie.TmdbID); err == nil && len(revs) > 0 {
			res.Reviews = revs
		}
	}

	return res, nil
}

func buildSearchLinks(title, imdbID string) domain.SearchLinks {
	encodedTitle := url.QueryEscape(title)
	links := domain.SearchLinks{
		Google:     fmt.Sprintf("https://www.google.com/search?q=watch+%s+movie", encodedTitle),
		JustWatch:  fmt.Sprintf("https://www.justwatch.com/us/search?q=%s", encodedTitle),
		Letterboxd: fmt.Sprintf("https://letterboxd.com/search/%s/", encodedTitle),
		Netflix:    fmt.Sprintf("https://www.netflix.com/search?q=%s", encodedTitle),
	}
	if imdbID != "" {
		links.IMDb = fmt.Sprintf("https://www.imdb.com/title/%s/", imdbID)
	} else {
		links.IMDb = fmt.Sprintf("https://www.imdb.com/find?q=%s", encodedTitle)
	}
	return links
}
