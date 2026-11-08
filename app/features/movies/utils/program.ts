import type { GridMovie } from "../types/movies.type";
import type { SyncMood } from "../components/action-confirm-modal";

/**
 * Derives a curated boutique cinema program theme (R-03)
 * from the active reel's movies and any selected mood filter.
 */
export function deriveProgramTheme(
  movies: GridMovie[],
  activeMood?: SyncMood,
): string {
  // 1. Explicit Mood Override (from Reshuffle)
  if (activeMood) {
    switch (activeMood) {
      case "horror":
        return "MIDNIGHT DREAD";
      case "action_crime":
        return "HIGH-OCTANE ADRENALINE";
      case "psychological":
        return "PSYCHOLOGICAL LABYRINTH";
      case "comedy":
        return "WARM LIGHT & LAUGHTER";
      case "classics":
        return "RETRO VAULT CLASSICS";
      case "surprise":
        break;
    }
  }

  if (!movies || movies.length === 0) {
    return "CURATOR'S CUT";
  }

  // 2. Aggregate genres & years across batch
  const genreCounts: Record<string, number> = {};
  let totalYears = 0;
  let validYearCount = 0;

  for (const movie of movies) {
    if (movie.genres && Array.isArray(movie.genres)) {
      for (const genre of movie.genres) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    }
    if (movie.release_date) {
      const year = parseInt(movie.release_date.slice(0, 4), 10);
      if (!isNaN(year)) {
        totalYears += year;
        validYearCount++;
      }
    }
  }

  const avgYear = validYearCount > 0 ? totalYears / validYearCount : 2020;
  const isVintage = avgYear < 2000;

  const horror = genreCounts["Horror"] || 0;
  const action = genreCounts["Action"] || 0;
  const adventure = genreCounts["Adventure"] || 0;
  const crime = genreCounts["Crime"] || 0;
  const mystery = genreCounts["Mystery"] || 0;
  const thriller = genreCounts["Thriller"] || 0;
  const sciFi = genreCounts["Science Fiction"] || 0;
  const comedy = genreCounts["Comedy"] || 0;
  const animation = genreCounts["Animation"] || 0;
  const family = genreCounts["Family"] || 0;
  const drama = genreCounts["Drama"] || 0;
  const romance = genreCounts["Romance"] || 0;

  // 3. Match dominant aesthetic (Animation & Family take precedence so cartoons are never mislabeled)
  if (animation >= 2 || (animation >= 1 && family >= 1)) {
    return "ANIMATED ESCAPISM";
  }
  if (animation + family + comedy >= 3) {
    return "WHIMSICAL WORLDS";
  }

  // Horror / Occult
  if (horror >= 2) {
    return "MIDNIGHT DREAD";
  }

  // Vintage crime / thriller
  if (isVintage && (crime >= 2 || thriller >= 2 || action >= 2)) {
    return "90s VAULT: NOIR & TENSION";
  }

  // Neon Noir & Crime (strictly non-animated)
  if (animation === 0 && (crime + mystery >= 3 || (crime >= 2 && thriller >= 2))) {
    return "NEON NOIR & SHADOWS";
  }

  // Action / Adventure
  if (action + adventure >= 3 || action >= 3) {
    return "HIGH-OCTANE THRILLS";
  }

  // Sci-Fi / Mindbenders
  if (sciFi >= 2 && (thriller >= 1 || mystery >= 1)) {
    return "MINDBENDERS & DARK HORIZONS";
  }
  if (sciFi >= 2) {
    return "SPECULATIVE HORIZONS";
  }

  // Thriller
  if (thriller >= 2) {
    return "COLD TENSION & SUSPENSE";
  }

  // Drama / Romance
  if (drama + romance >= 3) {
    return "RAW EMOTION & INTIMATE TRUTH";
  }

  // Comedy
  if (comedy >= 2) {
    return "SATIRE & SHARP WIT";
  }

  if (isVintage) {
    return "20TH CENTURY CLASSICS";
  }

  return "CURATOR'S SPOTLIGHT";
}
