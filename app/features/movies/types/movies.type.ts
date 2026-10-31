export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string;
  order: number;
}

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
  tagline?: string;
  director?: string;
  cast_members?: CastMember[];
  trailer_key?: string;
  release_date: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  original_language: string;
  spoken_languages?: string[];
  production_countries?: string[];
  popularity: number;
  created_at: string;
  is_watched?: boolean;
}

export type MovieInteractionAction =
  | "revealed"
  | "watched"
  | "skipped"
  | "watchlist_add"
  | "pick_tonight"
  | "locked_in";

export interface RecordInteractionPayload {
  movie_id: number;
  action: MovieInteractionAction;
  grid_session_id: string;
  grid_position?: number;
  reveal_action_ms?: number;
}

export interface GridMovie {
  slot_number: number;
  is_revealed: boolean;
  action?: MovieInteractionAction | null;
  movie_id: number;
  tmdb_id: number;
  vague_description: string;
  tagline?: string;
  genres: string[];
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average: number;
  release_date: string;
  grid_session_id?: string;
}

export interface MovieFilters {
  page?: number;
  pageSize?: number;
  genre?: string;
  search?: string;
}

export interface MovieDetailResponse {
  movie: Movie;
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
