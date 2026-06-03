package tmdb

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

type Movie struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	Overview    string  `json:"overview"`
	PosterPath  string  `json:"poster_path"`
	ReleaseDate string  `json:"release_date"`
	GenreIDs    []int   `json:"genre_ids"`
	Popularity  float64 `json:"popularity"`
	VoteAverage float64 `json:"vote_average"`
}

type MovieListResponse struct {
	Page         int     `json:"page"`
	Results      []Movie `json:"results"`
	TotalPages   int     `json:"total_pages"`
	TotalResults int     `json:"total_results"`
}

func (c *Client) GetMovies(ctx context.Context, page int) (*MovieListResponse, error) {
	url := fmt.Sprintf("%s/movie/popular?page=%d", c.baseURL, page)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.bearerToken)
	req.Header.Set("Accept", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tmdb: unexpected status code %d", resp.StatusCode)
	}

	var result MovieListResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}
