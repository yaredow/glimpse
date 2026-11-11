package tmdb

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestClient_GetWatchProviders(t *testing.T) {
	mockJSON := `{
		"id": 693134,
		"results": {
			"US": {
				"link": "https://www.justwatch.com/us/movie/dune-part-two",
				"flatrate": [
					{
						"logo_path": "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg",
						"provider_id": 8,
						"provider_name": "Netflix",
						"display_priority": 0
					}
				],
				"rent": [
					{
						"logo_path": "/q6tl6uq4X50m77hrvVHGWCEWIZ9.jpg",
						"provider_id": 2,
						"provider_name": "Apple TV",
						"display_priority": 1
					}
				],
				"buy": []
			}
		}
	}`

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/movie/693134/watch/providers", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(mockJSON))
	}))
	defer server.Close()

	client := NewClient("test-token", server.URL)
	providers, err := client.GetWatchProviders(context.Background(), 693134)

	require.NoError(t, err)
	require.NotNil(t, providers)
	assert.Equal(t, "https://www.justwatch.com/us/movie/dune-part-two", providers.JustWatchLink)
	require.Len(t, providers.Flatrate, 1)
	assert.Equal(t, "Netflix", providers.Flatrate[0].Name)
	require.Len(t, providers.Rent, 1)
	assert.Equal(t, "Apple TV", providers.Rent[0].Name)
}

