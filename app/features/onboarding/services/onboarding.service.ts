import { api } from "@/lib/api";
import type {
  OnboardingStartResponse,
  FinishOnboardingPayload,
  PreferenceResponse,
} from "../types/onboarding.type";

export const getOnboardingData = () => {
  return api.get("v1/onboarding/start").json<OnboardingStartResponse>();
};

export const submitPreferences = (data: FinishOnboardingPayload) => {
  return api.post("v1/onboarding/finish", { json: data }).json();
};

export const checkPreferences = () => {
  return api.get("v1/users/preferences").json<PreferenceResponse>();
};
