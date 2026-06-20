import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/constants";
import { http } from "@/lib/ky";
import { tryCatch } from "@/lib/try-catch";
import type { RefreshResponse } from "@/features/auth/types/auth.type";
import { useAuthStore } from "@/features/auth/store/auth.store";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

export const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

  if (!accessToken) return null;

  const { exp } = jwtDecode<{ exp: number }>(accessToken);
  const expiresInMs = exp * 1000 - Date.now();

  if (expiresInMs < TOKEN_EXPIRY_BUFFER_MS) {
    return await refreshAccessToken();
  }

  return accessToken;
};

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

  if (!refreshToken) return null;

  const { data, error } = await tryCatch(
    http
      .post("v1/tokens/refresh", {
        json: { refresh_token: refreshToken },
        context: { auth: false },
      })
      .json<RefreshResponse>(),
  );

  if (error) {
    await useAuthStore.getState().logout();
    return null;
  }

  await useAuthStore
    .getState()
    .setTokens(data.access_token.token, data.refresh_token.token);
  return data.access_token.token;
}
