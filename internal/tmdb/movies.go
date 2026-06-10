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

type Language struct {
	ISOCode     string `json:"iso_639_1"`
	EnglishName string `json:"english_name"`
	Name        string `json:"name"`
}

func (c *Client) GetMovies(ctx context.Context, page int) (*MovieListResponse, error) {
	var result MovieListResponse
	path := fmt.Sprintf("/movie/popular?page=%d", page)

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

func (c *Client) GetLanguages(ctx context.Context) ([]Language, error) {
	var result []Language

	if err := c.do(ctx, "/configuration/languages", &result); err != nil {
		return nil, err
	}

	return result, nil
}
