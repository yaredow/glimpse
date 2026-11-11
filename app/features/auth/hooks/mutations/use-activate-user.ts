import { useMutation } from "@tanstack/react-query";
import { activateAccount } from "../../services/auth.service";

export const useActivateUser = () => {
  return useMutation({
    mutationFn: (token: string) => activateAccount(token),
  });
};
