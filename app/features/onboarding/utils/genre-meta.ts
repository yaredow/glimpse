export interface GenreMeta {
  emoji: string;
  icon: string;
}

const GENRE_MAP: Record<string, GenreMeta> = {
  action: { emoji: "💥", icon: "fire" },
  adventure: { emoji: "🗺️", icon: "compass-outline" },
  animation: { emoji: "🎨", icon: "palette-outline" },
  comedy: { emoji: "🍿", icon: "emoticon-happy-outline" },
  crime: { emoji: "🕵️", icon: "incognito" },
  documentary: { emoji: "🎥", icon: "video-vintage" },
  drama: { emoji: "🎭", icon: "drama-masks" },
  family: { emoji: "🧸", icon: "account-group-outline" },
  fantasy: { emoji: "🧙‍♂️", icon: "magic-staff" },
  history: { emoji: "📜", icon: "book-open-page-variant-outline" },
  horror: { emoji: "👻", icon: "ghost-outline" },
  music: { emoji: "🎵", icon: "music" },
  mystery: { emoji: "🔍", icon: "magnify" },
  romance: { emoji: "🌹", icon: "heart-outline" },
  "science fiction": { emoji: "🚀", icon: "rocket-launch-outline" },
  "sci-fi": { emoji: "🚀", icon: "rocket-launch-outline" },
  "tv movie": { emoji: "📺", icon: "television-classic" },
  thriller: { emoji: "⚡", icon: "flash-outline" },
  war: { emoji: "🪖", icon: "shield-cross-outline" },
  western: { emoji: "🤠", icon: "horseshoe" },
};

export const getGenreMeta = (name: string): GenreMeta => {
  const key = name.toLowerCase().trim();
  return GENRE_MAP[key] || { emoji: "🎬", icon: "movie-open-outline" };
};

