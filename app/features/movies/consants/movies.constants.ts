export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
] as const;

export const DETAIL_TABS = ["CAST", "REVIEWS", "DETAILS"] as const;

// Torrent sources are opt-in so demos and public builds stay focused on legal availability.
export const SHOW_TORRENTS =
  process.env.EXPO_PUBLIC_SHOW_TORRENTS === "true";
