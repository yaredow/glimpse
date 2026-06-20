export interface Movie {
  id: number;
  tmdb_id: number;
  imdb_id?: string;
  vague_description: string;
  genres: string[];
  title: string;
  original_title: string;
  full_synopsis: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  original_language: string;
  popularity: number;
  created_at: string;
  is_watched?: boolean;
}

export interface GridMovie {
  slot_number: number;
  is_revealed: boolean;
  movie_id: number;
  tmdb_id: number;
  vague_description: string;
  genres: string[];
}

export interface MovieFilters {
  page?: number;
  pageSize?: number;
  genre?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  metadata: {
    current_page: number;
    first_page: number;
    last_page: number;
    page_size: number;
    total_records: number;
  };
  movies: T[];
}
