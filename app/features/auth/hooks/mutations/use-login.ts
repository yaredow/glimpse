import { useMutation } from "@tanstack/react-query";
import { logIn } from "../../services/auth.service";
import { LoginFormData } from "../../schemas/auth.schema";
import { useAuthStore } from "../../store/auth.store";

export const useLogin = () => {
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationFn: (data: LoginFormData) => logIn(data),
    onSuccess: async (data) => {
      await setTokens(data.access_token.token, data.refresh_token.token);
    },
  });
};
