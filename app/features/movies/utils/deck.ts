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
    action === "watched"
  );
}

/** A "seen before" entry is a watched entry in the Journal. */
export function isWatchedEntry(
  action?: MovieInteractionAction | string | null,
) {
  return action === "watched" || action === "seen_before";
}

/** Actions that can add or change a Journal entry. */
export function isJournalAction(
  action?: MovieInteractionAction | string | null,
) {
  return (
    isWatchedEntry(action) ||
    action === "watchlist_add" ||
    action === "pick_tonight"
  );
}

export function curatorNote(movie: { vague_description?: string }) {
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

export function formatRuntime(runtimeMinutes?: number): string {
  if (!runtimeMinutes || runtimeMinutes <= 0) return "Runtime TBA";
  const hours = Math.floor(runtimeMinutes / 60);
  const mins = runtimeMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function formatEndTime(runtimeMinutes?: number): string | null {
  if (!runtimeMinutes || runtimeMinutes <= 0) return null;
  const now = new Date();
  const end = new Date(now.getTime() + runtimeMinutes * 60 * 1000);
  const hours = end.getHours();
  const minutes = end.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `Ends ~${displayHours}:${displayMinutes} ${ampm}`;
}

const LANGUAGE_MAP: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  hi: "Hindi",
  pt: "Portuguese",
  ru: "Russian",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  ar: "Arabic",
};

export function formatLanguage(code?: string): string {
  if (!code) return "English";
  const lower = code.toLowerCase();
  return LANGUAGE_MAP[lower] || code.toUpperCase();
}

export function structuredClues(movie: GridMovie) {
  const clues: string[] = [];
  if (movie.genres?.[0]) clues.push(movie.genres[0]);
  const decade = decadeLabel(movie.release_date);
  if (decade) clues.push(decade);
  clues.push(runtimeLabel(movie.runtime) ?? ratingBand(movie.vote_average) ?? "Runtime TBA");
  return clues.slice(0, 3);
}

export function whyThisIsHere(movie: { genres?: string[]; release_date?: string }) {
  const genre = movie.genres?.[0]?.toLowerCase();
  const decade = decadeLabel(movie.release_date);
  if (genre && decade) {
    return `In tonight's five for ${genre} from the ${decade}.`;
  }
  if (genre) return `In tonight's five for ${genre}.`;
  return "In tonight's five based on your taste filters.";
}
