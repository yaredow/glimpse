import { useMutation } from "@tanstack/react-query";
import { LoginFormData } from "../../schemas/auth.schema";
import { logIn } from "../../services/auth.service";
import { useAuthStore } from "../../store/auth.store";
import Toast from "react-native-toast-message";
import { getErrorMessage } from "@/lib/error";

export const useLogin = () => {
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationFn: (data: LoginFormData) => logIn(data),
    onSuccess: async (data) => {
      await setTokens(data.access_token.token, data.refresh_token.token);

      Toast.show({
        type: "success",
        text1: "Login successful",
      });
    },
    onError: async (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: await getErrorMessage(error),
      });
    },
  });
};
