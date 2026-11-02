import type { MovieFilters } from "../types/movies.type";

export const moviesKeys = {
  all: () => ["movies"] as const,
  todayGrid: () => ["movies", "today-grid-v2"] as const,
  history: (action?: string) => ["movies", "history", action ?? "all"] as const,
  list: (filters?: MovieFilters) => ["movies", "list", filters ?? {}] as const,
  movie: (id: string | number) => ["movie", String(id)] as const,
  sources: (id: string | number) => ["movie", "sources", String(id)] as const,
};
