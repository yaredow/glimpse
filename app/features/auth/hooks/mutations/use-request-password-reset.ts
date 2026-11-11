import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "../../services/auth.service";

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
};
