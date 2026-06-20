import { useQuery } from "@tanstack/react-query";
import { checkPreferences } from "../../services/onboarding.service";
import type { PreferenceResponse } from "../../types/onboarding.type";
import { authKeys } from "@/features/auth/constants/auth.keys";

export const usePreferences = () => {
  return useQuery<PreferenceResponse | null>({
    queryKey: authKeys.preferences(),
    queryFn: async () => checkPreferences(),
    retry: false,
  });
};
