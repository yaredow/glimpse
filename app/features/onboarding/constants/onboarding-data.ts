import type { Genre, Language, EraPreset } from "../types/onboarding.type";

export const ONBOARDING_GENRES: Genre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export const ONBOARDING_ERAS: EraPreset[] = [
  {
    label: "Modern Hits (2015 – Present)",
    min_year: 2015,
    max_year: new Date().getFullYear(),
  },
  {
    label: "The New Millennium (2000 – 2014)",
    min_year: 2000,
    max_year: 2014,
  },
  {
    label: "90s Nostalgia (1990 – 1999)",
    min_year: 1990,
    max_year: 1999,
  },
  {
    label: "Retro Classics (1970 – 1989)",
    min_year: 1970,
    max_year: 1989,
  },
  {
    label: "Timeless Cinema (Pre-1970)",
    min_year: 1888,
    max_year: 1969,
  },
  {
    label: "Everything",
    min_year: 1888,
    max_year: new Date().getFullYear(),
  },
];

export const ONBOARDING_LANGUAGES: Language[] = [
  { iso_639_1: "en", english_name: "English", name: "English" },
  { iso_639_1: "ja", english_name: "Japanese", name: "日本語" },
  { iso_639_1: "ko", english_name: "Korean", name: "한국어/조선말" },
  { iso_639_1: "zh", english_name: "Chinese", name: "普通话" },
  { iso_639_1: "es", english_name: "Spanish", name: "Español" },
  { iso_639_1: "fr", english_name: "French", name: "Français" },
  { iso_639_1: "de", english_name: "German", name: "Deutsch" },
  { iso_639_1: "it", english_name: "Italian", name: "Italiano" },
  { iso_639_1: "pt", english_name: "Portuguese", name: "Português" },
  { iso_639_1: "ru", english_name: "Russian", name: "Pусский" },
  { iso_639_1: "ar", english_name: "Arabic", name: "العربية" },
  { iso_639_1: "tr", english_name: "Turkish", name: "Türkçe" },
  { iso_639_1: "nl", english_name: "Dutch", name: "Nederlands" },
  { iso_639_1: "sv", english_name: "Swedish", name: "Svenska" },
  { iso_639_1: "da", english_name: "Danish", name: "Dansk" },
  { iso_639_1: "no", english_name: "Norwegian", name: "Norsk" },
  { iso_639_1: "pl", english_name: "Polish", name: "Polski" },
  { iso_639_1: "th", english_name: "Thai", name: "ไทย" },
];
