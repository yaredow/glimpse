package torrent

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/yaredow/glimpse-api/internal/domain"
)

const (
	defaultYTSBaseURL = "https://yts.mx/api/v2"
	trackerList       = "&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://torrent.gresille.org:80/announce&tr=udp://p4p.arenabg.com:1337"
)

type YTSClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewYTSClient(baseURL ...string) *YTSClient {
	b := defaultYTSBaseURL
	if len(baseURL) > 0 && baseURL[0] != "" {
		b = baseURL[0]
	}
	return &YTSClient{
		baseURL: b,
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

type ytsResponse struct {
	Status        string `json:"status"`
	StatusMessage string `json:"status_message"`
	Data          struct {
		MovieCount int        `json:"movie_count"`
		Movies     []ytsMovie `json:"movies"`
	} `json:"data"`
}

type ytsMovie struct {
	ID       int          `json:"id"`
	ImdbCode string       `json:"imdb_code"`
	Title    string       `json:"title"`
	Year     int          `json:"year"`
	Torrents []ytsTorrent `json:"torrents"`
}

type ytsTorrent struct {
	URL       string `json:"url"`
	Hash      string `json:"hash"`
	Quality   string `json:"quality"`
	Type      string `json:"type"`
	Seeds     int    `json:"seeds"`
	Peers     int    `json:"peers"`
	Size      string `json:"size"`
	SizeBytes int64  `json:"size_bytes"`
}

func (c *YTSClient) SearchTorrents(ctx context.Context, imdbID, movieTitle string) ([]domain.TorrentSource, error) {
	searchTerm := imdbID
	if searchTerm == "" {
		searchTerm = movieTitle
	}
	if searchTerm == "" {
		return []domain.TorrentSource{}, nil
	}

	reqURL := fmt.Sprintf("%s/list_movies.json?query_term=%s", c.baseURL, url.QueryEscape(searchTerm))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("yts: status code %d", resp.StatusCode)
	}

	var data ytsResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	if data.Data.MovieCount == 0 || len(data.Data.Movies) == 0 {
		return []domain.TorrentSource{}, nil
	}

	matchedMovie := data.Data.Movies[0]
	torrents := make([]domain.TorrentSource, 0, len(matchedMovie.Torrents))

	for _, t := range matchedMovie.Torrents {
		dn := url.QueryEscape(fmt.Sprintf("%s (%d) [%s] [YTS]", matchedMovie.Title, matchedMovie.Year, t.Quality))
		magnet := fmt.Sprintf("magnet:?xt=urn:btih:%s&dn=%s%s", t.Hash, dn, trackerList)

		torrents = append(torrents, domain.TorrentSource{
			Quality:    t.Quality,
			Type:       t.Type,
			Size:       t.Size,
			SizeBytes:  t.SizeBytes,
			Seeds:      t.Seeds,
			Peers:      t.Peers,
			Magnet:     magnet,
			TorrentURL: t.URL,
		})
	}

	return torrents, nil
}

