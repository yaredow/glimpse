import { api } from "@/lib/api";
import { LoginFormData, RegisterFormData } from "../schemas/auth.schema";
import { ActivateResponse, LoginResponse } from "../types/auth.type";
import { useAuthStore } from "../store/auth.store";

export const logIn = async (data: LoginFormData): Promise<LoginResponse> => {
  return api
    .post("v1/users/login", { json: data, context: { auth: false } })
    .json<LoginResponse>();
};

export const register = async (data: RegisterFormData) => {
  return api
    .post("v1/users/register", { json: data, context: { auth: false } })
    .json();
};

export const activateAccount = async (token: string) => {
  return api
    .put("v1/users/activates", {
      json: { token: token.trim() },
      context: { auth: false },
    })
    .json<ActivateResponse>();
};

export const requestPasswordReset = async (email: string) => {
  return api
    .post("v1/tokens/password-reset", {
      json: { email: email.trim().toLowerCase() },
      context: { auth: false },
    })
    .json();
};

export const resetPassword = async (token: string, newPassword: string) => {
  return api
    .put("v1/users/password", {
      json: { token: token.trim(), newPassword },
      context: { auth: false },
    })
    .json();
};

export const logout = async () => {
  const refreshToken = useAuthStore.getState().refreshToken;

  return api
    .post("v1/tokens/revoke", { json: { refresh_token: refreshToken } })
    .json();
};
