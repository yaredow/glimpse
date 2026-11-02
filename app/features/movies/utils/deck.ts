import type { GridMovie, MovieInteractionAction } from "../types/movies.type";

export function isTonightPickAction(
  action?: MovieInteractionAction | string | null,
) {
  return action === "pick_tonight" || action === "locked_in";
}

export function isResolvedAction(
  action?: MovieInteractionAction | string | null,
) {
  return (
    action === "skipped" ||
    action === "seen_before" ||
    action === "watched" ||
    action === "pick_tonight" ||
    action === "locked_in" ||
    action === "watchlist_add"
  );
}

export function curatorNote(movie: GridMovie) {
  const note = movie.vague_description?.trim();
  if (note) return note;
  return "A sealed pick for tonight — enough to decide a no, not a yes.";
}

export function decadeLabel(releaseDate?: string) {
  if (!releaseDate) return null;
  const year = new Date(releaseDate).getFullYear();
  if (!Number.isFinite(year) || year < 1888) return null;
  return `${Math.floor(year / 10) * 10}s`;
}

export function ratingBand(voteAverage: number) {
  if (!Number.isFinite(voteAverage) || voteAverage <= 0) return null;
  if (voteAverage >= 8) return "Highly rated";
  if (voteAverage >= 7) return "Well liked";
  if (voteAverage >= 6) return "Solidly liked";
  return "Under the radar";
}

export function runtimeLabel(runtime?: number) {
  if (!runtime || runtime <= 0) return null;
  return `${runtime} min`;
}

export function structuredClues(movie: GridMovie) {
  const clues: string[] = [];
  if (movie.genres?.[0]) clues.push(movie.genres[0]);
  const decade = decadeLabel(movie.release_date);
  if (decade) clues.push(decade);
  clues.push(runtimeLabel(movie.runtime) ?? ratingBand(movie.vote_average) ?? "Runtime TBA");
  return clues.slice(0, 3);
}

export function whyThisIsHere(movie: GridMovie) {
  const genre = movie.genres?.[0]?.toLowerCase();
  const decade = decadeLabel(movie.release_date);
  if (genre && decade) {
    return `In tonight's five for ${genre} from the ${decade}.`;
  }
  if (genre) return `In tonight's five for ${genre}.`;
  return "In tonight's five based on your taste filters.";
}
