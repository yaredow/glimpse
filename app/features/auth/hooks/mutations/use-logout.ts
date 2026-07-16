import { useMutation } from "@tanstack/react-query";
import { logout } from "../../services/auth.service";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/auth.store";

export const useLogout = () => {
  const router = useRouter();
  const { logout: clearTokens } = useAuthStore();

  return useMutation({
    mutationFn: () => logout(),
    onSettled: async () => {
      await clearTokens();
      router.replace("/(auth)/login");
    },
  });
};
