package tmdb

import (
	"context"
	"fmt"
)

type Movie struct {
	ID               int     `json:"id"`
	Title            string  `json:"title"`
	OriginalTitle    string  `json:"original_title"`
	Overview         string  `json:"overview"`
	PosterPath       string  `json:"poster_path"`
	BackdropPath     string  `json:"backdrop_path"`
	ReleaseDate      string  `json:"release_date"`
	GenreIDs         []int   `json:"genre_ids"`
	OriginalLanguage string  `json:"original_language"`
	Popularity       float64 `json:"popularity"`
	VoteAverage      float64 `json:"vote_average"`
	VoteCount        int     `json:"vote_count"`
}

type MovieListResponse struct {
	Page         int     `json:"page"`
	Results      []Movie `json:"results"`
	TotalPages   int     `json:"total_pages"`
	TotalResults int     `json:"total_results"`
}

type Genre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type GenreListResponse struct {
	Genres []Genre `json:"genres"`
}

func (c *Client) GetPopularMovies(ctx context.Context, page int) (*MovieListResponse, error) {
	var result MovieListResponse
	path := fmt.Sprintf("/movie/popular?page=%d", page)

	if err := c.do(ctx, path, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

func (c *Client) GetTopRatedMovies(ctx context.Context, page int) (*MovieListResponse, error) {
	var result MovieListResponse
	path := fmt.Sprintf("/movie/top_rated?page=%d", page)

	if err := c.do(ctx, path, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

func (c *Client) GetGenres(ctx context.Context) (*GenreListResponse, error) {
	var result GenreListResponse

	if err := c.do(ctx, "/genre/movie/list", &result); err != nil {
		return nil, err
	}

	return &result, nil
}

type (
	CastMember struct {
		ID          int    `json:"id"`
		Name        string `json:"name"`
		Character   string `json:"character"`
		ProfilePath string `json:"profile_path"`
		Order       int    `json:"order"`
	}

	CrewMember struct {
		ID          int    `json:"id"`
		Name        string `json:"name"`
		Job         string `json:"job"`
		Department  string `json:"department"`
		ProfilePath string `json:"profile_path"`
	}

	CreditsResponse struct {
		Cast []CastMember `json:"cast"`
		Crew []CrewMember `json:"crew"`
	}

	Video struct {
		Key      string `json:"key"`
		Site     string `json:"site"`
		Type     string `json:"type"`
		Official bool   `json:"official"`
	}

	VideosResponse struct {
		Results []Video `json:"results"`
	}

	MovieDetailResponse struct {
		ID                  int                 `json:"id"`
		ImdbID              *string             `json:"imdb_id"`
		Runtime             *int                `json:"runtime"`
		Tagline             *string             `json:"tagline"`
		Overview            string              `json:"overview"`
		PosterPath          string              `json:"poster_path"`
		BackdropPath        string              `json:"backdrop_path"`
		SpokenLanguages     []SpokenLanguage    `json:"spoken_languages"`
		ProductionCountries []ProductionCountry `json:"production_countries"`
		Credits             *CreditsResponse    `json:"credits"`
		Videos              *VideosResponse     `json:"videos"`
		Recommendations     *MovieListResponse  `json:"recommendations"`
	}

	SpokenLanguage struct {
		Iso6391 string `json:"iso_639_1"`
		Name    string `json:"name"`
	}

	ProductionCountry struct {
		Iso31661 string `json:"iso_3166_1"`
		Name     string `json:"name"`
	}
)

func (c *Client) GetMovieDetails(ctx context.Context, tmdbID int) (*MovieDetailResponse, error) {
	var result MovieDetailResponse
	path := fmt.Sprintf("/movie/%d?append_to_response=credits,videos,recommendations&language=en-US", tmdbID)

	if err := c.do(ctx, path, &result); err != nil {
		return nil, err
	}

	return &result, nil
}
