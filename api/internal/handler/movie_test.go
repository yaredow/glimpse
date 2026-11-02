package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/handler"
)

type mockMovieService struct {
	mock.Mock
}

func (m *mockMovieService) GetByID(ctx context.Context, userID, movieID int64) (*domain.Movie, error) {
	args := m.Called(ctx, userID, movieID)
	movie, _ := args.Get(0).(*domain.Movie)
	return movie, args.Error(1)
}

func (m *mockMovieService) GetSources(ctx context.Context, movieID int64) (*domain.MovieSourcesResponse, error) {
	args := m.Called(ctx, movieID)
	res, _ := args.Get(0).(*domain.MovieSourcesResponse)
	return res, args.Error(1)
}

func TestMovieHandler_GetMovieSources(t *testing.T) {
	mockSvc := &mockMovieService{}
	h := handler.NewMovieHandler(mockSvc)
	e := echo.New()

	expectedSources := &domain.MovieSourcesResponse{
		MovieID: 42,
		Title:   "Dune: Part Two",
		ImdbID:  "tt1523967",
		TmdbID:  693134,
		Torrents: []domain.TorrentSource{
			{Quality: "1080p", Seeds: 300},
		},
		SearchLinks: domain.SearchLinks{
			Google: "https://www.google.com/search?q=watch+Dune",
		},
	}

	mockSvc.On("GetSources", mock.Anything, int64(42)).Return(expectedSources, nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/movies/42/sources", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/v1/movies/:id/sources")
	c.SetPathValues(echo.PathValues{
		{Name: "id", Value: "42"},
	})

	err := h.GetMovieSources(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp struct {
		Sources domain.MovieSourcesResponse `json:"sources"`
	}
	err = json.Unmarshal(rec.Body.Bytes(), &resp)
	require.NoError(t, err)
	assert.Equal(t, int64(42), resp.Sources.MovieID)
	assert.Equal(t, "Dune: Part Two", resp.Sources.Title)
	require.Len(t, resp.Sources.Torrents, 1)
}
