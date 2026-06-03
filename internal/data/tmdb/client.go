package tmdb

import (
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
