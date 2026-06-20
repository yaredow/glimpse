import type { MovieFilters } from "../types/movies.type";

export const moviesKeys = {
  all: () => ["movies"] as const,
  list: (filters?: MovieFilters) => ["movies", "list", filters ?? {}] as const,
  movie: (id: string | number) => ["movie", String(id)] as const,
};
