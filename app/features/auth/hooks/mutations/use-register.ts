import { useMutation } from "@tanstack/react-query";
import { register } from "../../services/auth.service";
import { RegisterFormData } from "../../schemas/auth.schema";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { getErrorMessage } from "@/lib/error";

export const useRegister = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: RegisterFormData) => register(data),
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Registration successful",
        text2: "You can now log in",
        onHide: () => router.push("/(auth)/activate"),
      });
    },
    onError: async (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Registration failed",
        text2: await getErrorMessage(error),
      });
    },
  });
};
