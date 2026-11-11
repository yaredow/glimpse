import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../../services/auth.service";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/auth.store";

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout: clearTokens } = useAuthStore();

  return useMutation({
    mutationFn: () => logout(),
    onSettled: async () => {
      await clearTokens();
      queryClient.clear();
      router.replace("/(auth)/login");
    },
  });
};
