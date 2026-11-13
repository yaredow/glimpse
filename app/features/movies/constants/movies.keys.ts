export const moviesKeys = {
  todayGrid: () => ["movies", "today-grid-v2"] as const,
  historyRoot: () => ["movies", "history"] as const,
  history: (action?: string) => ["movies", "history", action ?? "all"] as const,
  movie: (id: string | number) => ["movie", String(id)] as const,
  sources: (id: string | number) => ["movie", "sources", String(id)] as const,
  reviews: (id: string | number) => ["movie", "reviews", String(id)] as const,
};
