import { create } from "zustand";

interface OnboardingState {
  favoriteGenres: number[];
  minYear: number | null;
  maxYear: number | null;
  languages: string[];
  excludedGenres: number[];
  minRating: number;

  setFavoriteGenres: (ids: number[]) => void;
  setEra: (minYear: number, maxYear: number) => void;
  setLanguages: (codes: string[]) => void;
  setExcludedGenres: (ids: number[]) => void;
  setMinRating: (rating: number) => void;
  reset: () => void;
}

const initialState = {
  favoriteGenres: [] as number[],
  minYear: null as number | null,
  maxYear: null as number | null,
  languages: [] as string[],
  excludedGenres: [] as number[],
  minRating: 0,
};

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  ...initialState,

  setFavoriteGenres: (favoriteGenres) => set({ favoriteGenres }),
  setEra: (minYear, maxYear) => set({ minYear, maxYear }),
  setLanguages: (languages) => set({ languages }),
  setExcludedGenres: (excludedGenres) => set({ excludedGenres }),
  setMinRating: (minRating) => set({ minRating }),
  reset: () => set({ ...initialState }),
}));
