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
  rating?: number;
}

export interface GridMovie {
  slot_number: number;
  is_revealed: boolean;
  action?: MovieInteractionAction | null;
  is_locked_in?: boolean;
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

export interface HistoryMovie {
  movie_id: number;
  action: "watched" | "watchlist_add" | string;
  acted_at: string;
  rating?: number | null;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  genres: string[];
  release_date: string;
  vote_average: number;
  runtime?: number;
  vague_description: string;
  full_synopsis?: string;
  tagline?: string;
  director?: string;
  cast_members?: CastMember[];
  trailer_key?: string;
}

export interface HistoryResponse {
  history: HistoryMovie[];
}

export interface WatchProvider {
  provider_id: number;
  name: string;
  logo_path: string;
}

export interface WatchProvidersResult {
  justwatch_link?: string;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface TorrentSource {
  quality: string;
  type: string;
  size: string;
  size_bytes: number;
  seeds: number;
  peers: number;
  magnet: string;
  torrent_url?: string;
}

export interface SearchLinks {
  google: string;
  justwatch: string;
  letterboxd: string;
  imdb: string;
  netflix: string;
}

export interface MovieSourcesResponse {
  movie_id: number;
  title: string;
  imdb_id?: string;
  tmdb_id: number;
  providers?: WatchProvidersResult;
  torrents: TorrentSource[];
  search_links: SearchLinks;
}
