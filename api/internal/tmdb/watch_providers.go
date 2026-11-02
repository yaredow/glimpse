package tmdb

import (
	"context"
	"fmt"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type TMDBWatchProvider struct {
	LogoPath        string `json:"logo_path"`
	ProviderID      int    `json:"provider_id"`
	ProviderName    string `json:"provider_name"`
	DisplayPriority int    `json:"display_priority"`
}

type TMDBCountryWatchProviders struct {
	Link     string              `json:"link"`
	Flatrate []TMDBWatchProvider `json:"flatrate"`
	Rent     []TMDBWatchProvider `json:"rent"`
	Buy      []TMDBWatchProvider `json:"buy"`
}

type TMDBWatchProvidersResponse struct {
	ID      int                                  `json:"id"`
	Results map[string]TMDBCountryWatchProviders `json:"results"`
}

func (c *Client) GetWatchProviders(ctx context.Context, tmdbID int) (*domain.WatchProvidersResult, error) {
	var resp TMDBWatchProvidersResponse
	path := fmt.Sprintf("/movie/%d/watch/providers", tmdbID)

	if err := c.do(ctx, path, &resp); err != nil {
		return nil, err
	}

	country, ok := resp.Results["US"]
	if !ok {
		for _, v := range resp.Results {
			country = v
			ok = true
			break
		}
	}

	if !ok {
		return &domain.WatchProvidersResult{
			Flatrate: []domain.WatchProvider{},
			Rent:     []domain.WatchProvider{},
			Buy:      []domain.WatchProvider{},
		}, nil
	}

	mapProviders := func(in []TMDBWatchProvider) []domain.WatchProvider {
		if in == nil {
			return []domain.WatchProvider{}
		}
		out := make([]domain.WatchProvider, len(in))
		for i, p := range in {
			out[i] = domain.WatchProvider{
				ProviderID: p.ProviderID,
				Name:       p.ProviderName,
				LogoPath:   p.LogoPath,
			}
		}
		return out
	}

	return &domain.WatchProvidersResult{
		JustWatchLink: country.Link,
		Flatrate:      mapProviders(country.Flatrate),
		Rent:          mapProviders(country.Rent),
		Buy:           mapProviders(country.Buy),
	}, nil
}

