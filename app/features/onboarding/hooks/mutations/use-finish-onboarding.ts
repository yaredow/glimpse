import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { submitPreferences } from "../../services/onboarding.service";
import { useOnboardingStore } from "../../store/onboarding.store";
import type { FinishOnboardingPayload } from "../../types/onboarding.type";
import { getErrorMessage } from "@/lib/error";
import { authKeys } from "@/features/auth/constants/auth.keys";

export const useFinishOnboarding = () => {
  const queryClient = useQueryClient();
  const reset = useOnboardingStore((s) => s.reset);

  return useMutation({
    mutationFn: (data: FinishOnboardingPayload) => submitPreferences(data),
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: authKeys.preferences() });
      router.replace("/(app)/(tabs)");
    },
    onError: async (error: Error) => {
      console.log("finish onboarding error", error.message);
      Toast.show({
        type: "error",
        text1: "Failed to save preferences",
        text2: await getErrorMessage(error),
      });
    },
  });
};
