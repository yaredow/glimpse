package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type mockMovieRepo struct {
	movie *domain.Movie
	err   error
}

func (m *mockMovieRepo) GetByID(ctx context.Context, movieID int64) (*domain.Movie, error) {
	return m.movie, m.err
}

type mockWatcher struct {
	watched bool
	err     error
}

func (m *mockWatcher) HasWatched(ctx context.Context, userID, movieID int64) (bool, error) {
	return m.watched, m.err
}

type mockProviderFetcher struct {
	res *domain.WatchProvidersResult
	err error
}

func (m *mockProviderFetcher) GetWatchProviders(ctx context.Context, tmdbID int) (*domain.WatchProvidersResult, error) {
	return m.res, m.err
}

type mockTorrentSearcher struct {
	torrents []domain.TorrentSource
	err      error
}

func (m *mockTorrentSearcher) SearchTorrents(ctx context.Context, imdbID, movieTitle string) ([]domain.TorrentSource, error) {
	return m.torrents, m.err
}

func TestMovieService_GetSources(t *testing.T) {
	imdbID := "tt1523967"
	movie := &domain.Movie{
		ID:     42,
		Title:  "Dune: Part Two",
		TmdbID: 693134,
		ImdbID: &imdbID,
	}

	repo := &mockMovieRepo{movie: movie}
	watcher := &mockWatcher{}
	providerMock := &mockProviderFetcher{
		res: &domain.WatchProvidersResult{
			Flatrate: []domain.WatchProvider{{Name: "Netflix"}},
		},
	}
	torrentMock := &mockTorrentSearcher{
		torrents: []domain.TorrentSource{
			{Quality: "1080p", Seeds: 500},
		},
	}

	svc := NewMovieService(repo, watcher).WithSources(providerMock, torrentMock)
	res, err := svc.GetSources(context.Background(), 42)

	require.NoError(t, err)
	require.NotNil(t, res)
	assert.Equal(t, int64(42), res.MovieID)
	assert.Equal(t, "Dune: Part Two", res.Title)
	assert.Equal(t, "tt1523967", res.ImdbID)
	assert.Equal(t, 693134, res.TmdbID)
	require.NotNil(t, res.Providers)
	require.Len(t, res.Providers.Flatrate, 1)
	assert.Equal(t, "Netflix", res.Providers.Flatrate[0].Name)
	require.Len(t, res.Torrents, 1)
	assert.Equal(t, "1080p", res.Torrents[0].Quality)
	assert.Contains(t, res.SearchLinks.Google, "Dune")
	assert.Contains(t, res.SearchLinks.IMDb, "tt1523967")
}

