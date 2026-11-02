import { useMutation } from "@tanstack/react-query";
import { register } from "../../services/auth.service";
import { RegisterFormData } from "../../schemas/auth.schema";

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterFormData) => register(data),
  });
};
