import { useMutation } from "@tanstack/react-query";
import { activateAccount } from "../../services/auth.service";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { getErrorMessage } from "@/lib/error";

export const useActivateUser = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (token: string) => activateAccount(token),
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Account activated",
        onHide: () => {
          router.push("/(app)/(tabs)");
        },
      });
    },
    onError: async (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Failed to activate account",
        text2: await getErrorMessage(error),
      });
    },
  });
};
