package torrent

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestYTSClient_SearchTorrents(t *testing.T) {
	mockJSON := `{
		"status": "ok",
		"status_message": "Query was successful",
		"data": {
			"movie_count": 1,
			"movies": [
				{
					"id": 54321,
					"imdb_code": "tt1523967",
					"title": "Dune: Part Two",
					"year": 2024,
					"torrents": [
						{
							"url": "https://yts.mx/torrent/download/123",
							"hash": "ABC123DEF456",
							"quality": "1080p",
							"type": "bluray",
							"seeds": 850,
							"peers": 120,
							"size": "2.4 GB",
							"size_bytes": 2576980377
						}
					]
				}
			]
		}
	}`

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/list_movies.json", r.URL.Path)
		assert.Equal(t, "tt1523967", r.URL.Query().Get("query_term"))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(mockJSON))
	}))
	defer server.Close()

	client := NewYTSClient(server.URL)
	torrents, err := client.SearchTorrents(context.Background(), "tt1523967", "Dune: Part Two")

	require.NoError(t, err)
	require.Len(t, torrents, 1)
	assert.Equal(t, "1080p", torrents[0].Quality)
	assert.Equal(t, "bluray", torrents[0].Type)
	assert.Equal(t, "2.4 GB", torrents[0].Size)
	assert.Equal(t, 850, torrents[0].Seeds)
	assert.Contains(t, torrents[0].Magnet, "magnet:?xt=urn:btih:ABC123DEF456")
}

func TestYTSClient_SearchTorrents_Empty(t *testing.T) {
	mockJSON := `{
		"status": "ok",
		"data": {
			"movie_count": 0
		}
	}`

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(mockJSON))
	}))
	defer server.Close()

	client := NewYTSClient(server.URL)
	torrents, err := client.SearchTorrents(context.Background(), "tt0000000", "Unknown")

	require.NoError(t, err)
	assert.Empty(t, torrents)
}

