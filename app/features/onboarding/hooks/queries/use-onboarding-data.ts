import { useQuery } from "@tanstack/react-query";
import type { HTTPError } from "@/lib/ky";
import { getOnboardingData } from "../../services/onboarding.service";
import type { OnboardingStartResponse } from "../../types/onboarding.type";

export const onboardingKeys = {
  all: () => ["onboarding"] as const,
  start: () => ["onboarding", "start"] as const,
};

export const useOnboardingData = () => {
  return useQuery<OnboardingStartResponse, HTTPError>({
    queryKey: onboardingKeys.start(),
    queryFn: getOnboardingData,
    staleTime: Infinity,
  });
};
