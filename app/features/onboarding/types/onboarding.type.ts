export interface Genre {
  id: number;
  name: string;
}

export interface Language {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export interface EraPreset {
  label: string;
  min_year: number;
  max_year: number;
}

export interface OnboardingStartResponse {
  genres: Genre[];
  languages: Language[];
  eras: EraPreset[];
}

export interface FinishOnboardingPayload {
  favorite_genres: number[];
  excluded_genres: number[];
  languages: string[];
  min_rating: number;
  min_year: number;
  max_year: number;
}

export interface UserPreference {
  user_id: number;
  favorite_genres: number[];
  excluded_genres: number[];
  languages: string[];
  min_rating: number;
  onboarded: boolean;
  min_year: number;
  max_year: number;
}

export interface PreferenceResponse {
  preferences: UserPreference;
}
