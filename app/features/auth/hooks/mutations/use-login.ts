import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginFormData } from "../../schemas/auth.schema";
import { logIn } from "../../services/auth.service";
import { useAuthStore } from "../../store/auth.store";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { getErrorMessage } from "@/lib/error";
import { authKeys } from "../../constants/auth.keys";
import { checkPreferences } from "@/features/onboarding/services/onboarding.service";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationFn: (data: LoginFormData) => logIn(data),
    onSuccess: async (data) => {
      await setTokens(data.access_token.token, data.refresh_token);
      queryClient.removeQueries({ queryKey: authKeys.preferences() });

      const prefs = await checkPreferences().catch(() => null);
      queryClient.setQueryData(authKeys.preferences(), prefs);

      Toast.show({
        type: "success",
        text1: "Login successful",
      });

      if (prefs?.preferences?.onboarded) {
        router.push("/(app)/(tabs)");
      } else {
        router.push("/(onboarding)");
      }
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
