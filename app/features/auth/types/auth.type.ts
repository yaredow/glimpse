export interface RegisterResponse {
  name: string;
  email: string;
  activated: boolean;
}

export interface AccessToken {
  token: string;
  expires_at: string;
}

export interface LoginResponse {
  access_token: AccessToken;
  refresh_token: AccessToken;
}

export interface RefreshResponse {
  access_token: AccessToken;
  refresh_token: AccessToken;
}
