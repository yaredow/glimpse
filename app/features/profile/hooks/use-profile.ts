import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../services/profile.service";
import type { UserProfileResponse } from "../types/profile.type";

export const profileKeys = {
  me: () => ["profile", "me"] as const,
};

export const useProfile = (enabled?: boolean) => {
  return useQuery<UserProfileResponse>({
    queryKey: profileKeys.me(),
    queryFn: () => getProfile(),
    retry: 2,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};
