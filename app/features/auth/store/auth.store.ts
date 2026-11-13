import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  HAS_AUTHENTICATED_KEY,
  HAS_SEEN_WELCOME_KEY,
} from "@/constants";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  hasAuthenticated: boolean;
  hasSeenWelcome: boolean;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setHasSeenWelcome: (seen: boolean) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  hasAuthenticated: false,
  hasSeenWelcome: false,

  isRestoring: true,

  setTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(HAS_AUTHENTICATED_KEY, "true");
    await SecureStore.setItemAsync(HAS_SEEN_WELCOME_KEY, "true");
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
      hasAuthenticated: true,
      hasSeenWelcome: true,
    });
  },

  setHasSeenWelcome: async (seen) => {
    if (seen) {
      await SecureStore.setItemAsync(HAS_SEEN_WELCOME_KEY, "true");
    } else {
      await SecureStore.deleteItemAsync(HAS_SEEN_WELCOME_KEY);
    }
    set({ hasSeenWelcome: seen });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasAuthenticated: true,
      hasSeenWelcome: true,
    });
  },

  restoreToken: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const hasAuth = await SecureStore.getItemAsync(HAS_AUTHENTICATED_KEY);
      const hasSeenWelcome = await SecureStore.getItemAsync(HAS_SEEN_WELCOME_KEY);
      const hasSession = !!accessToken && !!refreshToken;
      set({
        accessToken,
        refreshToken,
        isAuthenticated: hasSession,
        hasAuthenticated: hasSession || hasAuth === "true",
        hasSeenWelcome: hasSeenWelcome === "true" || hasSession || hasAuth === "true",
        isRestoring: false,
      });
    } catch {
      set({ isRestoring: false });
    }
  },
}));
