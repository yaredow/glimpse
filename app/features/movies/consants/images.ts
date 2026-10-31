export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const tmdbImage = (
  path?: string | null,
  size: "w185" | "w500" | "w780" | "w1280" | "original" = "w500",
) => {
  if (!path) return null;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
};
