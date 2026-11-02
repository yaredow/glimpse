package domain

type WatchProvider struct {
	ProviderID int    `json:"provider_id"`
	Name       string `json:"name"`
	LogoPath   string `json:"logo_path"`
}

type WatchProvidersResult struct {
	JustWatchLink string          `json:"justwatch_link,omitempty"`
	Flatrate      []WatchProvider `json:"flatrate"`
	Rent          []WatchProvider `json:"rent"`
	Buy           []WatchProvider `json:"buy"`
}

type TorrentSource struct {
	Quality    string `json:"quality"`
	Type       string `json:"type"`
	Size       string `json:"size"`
	SizeBytes  int64  `json:"size_bytes"`
	Seeds      int    `json:"seeds"`
	Peers      int    `json:"peers"`
	Magnet     string `json:"magnet"`
	TorrentURL string `json:"torrent_url,omitempty"`
}

type SearchLinks struct {
	Google     string `json:"google"`
	JustWatch  string `json:"justwatch"`
	Letterboxd string `json:"letterboxd"`
	IMDb       string `json:"imdb"`
	Netflix    string `json:"netflix"`
}

type MovieSourcesResponse struct {
	MovieID     int64                 `json:"movie_id"`
	Title       string                `json:"title"`
	ImdbID      string                `json:"imdb_id,omitempty"`
	TmdbID      int                   `json:"tmdb_id"`
	Providers   *WatchProvidersResult `json:"providers,omitempty"`
	Torrents    []TorrentSource       `json:"torrents"`
	SearchLinks SearchLinks           `json:"search_links"`
}

