import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import type { UserPreference } from "../types/onboarding.type";

type OnboardingMode = "onboarding" | "edit";

export interface OnboardingState {
  mode: OnboardingMode;
  favoriteGenres: number[];
  minYear: number | null;
  maxYear: number | null;
  languages: string[];
  excludedGenres: number[];
  minRating: number;
  hasCompletedLocalOnboarding: boolean;

  setMode: (mode: OnboardingMode) => void;
  hydrateFromPreference: (preference: UserPreference) => void;
  setFavoriteGenres: (ids: number[]) => void;
  setEra: (minYear: number, maxYear: number) => void;
  setLanguages: (codes: string[]) => void;
  setExcludedGenres: (ids: number[]) => void;
  setMinRating: (rating: number) => void;
  setHasCompletedLocalOnboarding: (completed: boolean) => void;
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
  hasCompletedLocalOnboarding: false,
};

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // ignore
    }
  },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
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
      setHasCompletedLocalOnboarding: (hasCompletedLocalOnboarding) =>
        set({ hasCompletedLocalOnboarding }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: "glimpse_onboarding_store",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        favoriteGenres: state.favoriteGenres,
        minYear: state.minYear,
        maxYear: state.maxYear,
        languages: state.languages,
        excludedGenres: state.excludedGenres,
        minRating: state.minRating,
        hasCompletedLocalOnboarding: state.hasCompletedLocalOnboarding,
      }),
    }
  )
);
