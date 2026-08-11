export interface UserProfile {
  id: number;
  email: string;
  name: string;
  activated: boolean;
  suspended_at: string | null;
  onboarded: boolean;
  skips_remaining: number;
  syncs_remaining: number;
  last_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileResponse {
  user: UserProfile;
}
