export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const tmdbImage = (
  path?: string | null,
  size: "w185" | "w500" | "original" = "w500",
) => (path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null);
