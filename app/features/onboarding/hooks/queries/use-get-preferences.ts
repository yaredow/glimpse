import { useQuery } from "@tanstack/react-query";
import { checkPreferences } from "../../services/onboarding.service";
import type { PreferenceResponse } from "../../types/onboarding.type";
import { authKeys } from "@/features/auth/constants/auth.keys";

export const useGetPreferences = (enabled?: boolean) => {
  return useQuery<PreferenceResponse | null>({
    queryKey: authKeys.preferences(),
    queryFn: async () => checkPreferences(),
    retry: 2,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};
