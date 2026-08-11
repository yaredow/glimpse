import { api } from "@/lib/api";
import type { UserProfileResponse } from "../types/profile.type";

export const getProfile = () => {
  return api.get("v1/me").json<UserProfileResponse>();
};
