import { create } from "zustand";
import type { UserPreference } from "../types/onboarding.type";

type OnboardingMode = "onboarding" | "edit";

interface OnboardingState {
  mode: OnboardingMode;
  favoriteGenres: number[];
  minYear: number | null;
  maxYear: number | null;
  languages: string[];
  excludedGenres: number[];
  minRating: number;

  setMode: (mode: OnboardingMode) => void;
  hydrateFromPreference: (preference: UserPreference) => void;
  setFavoriteGenres: (ids: number[]) => void;
  setEra: (minYear: number, maxYear: number) => void;
  setLanguages: (codes: string[]) => void;
  setExcludedGenres: (ids: number[]) => void;
  setMinRating: (rating: number) => void;
  reset: () => void;
}

const initialState = {
  mode: "onboarding" as OnboardingMode,
  favoriteGenres: [] as number[],
  minYear: null as number | null,
  maxYear: null as number | null,
  languages: [] as string[],
  excludedGenres: [] as number[],
  minRating: 0,
};

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  hydrateFromPreference: (preference) =>
    set({
      favoriteGenres: preference.favorite_genres,
      excludedGenres: preference.excluded_genres,
      languages: preference.languages,
      minRating: preference.min_rating,
      minYear: preference.min_year,
      maxYear: preference.max_year,
    }),

  setFavoriteGenres: (favoriteGenres) => set({ favoriteGenres }),
  setEra: (minYear, maxYear) => set({ minYear, maxYear }),
  setLanguages: (languages) => set({ languages }),
  setExcludedGenres: (excludedGenres) => set({ excludedGenres }),
  setMinRating: (minRating) => set({ minRating }),
  reset: () => set({ ...initialState }),
}));
