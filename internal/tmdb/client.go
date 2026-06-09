package tmdb

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	bearerToken string
	baseURL     string
	httpClient  *http.Client
}

func NewClient(bearerToken, baseURL string) *Client {
	return &Client{
		bearerToken: bearerToken,
		baseURL:     baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Client) do(ctx context.Context, path string, dst any) error {
	url := c.baseURL + path

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+c.bearerToken)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("tmdb: unexpected status code %d", resp.StatusCode)
	}

	return json.NewDecoder(resp.Body).Decode(dst)
}
