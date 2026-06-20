export interface RegisterResponse {
  name: string;
  email: string;
  activated: boolean;
}

export interface AccessToken {
  token: string;
  expiry: string;
}

type refreshToken = string;

export interface LoginResponse {
  access_token: AccessToken;
  refresh_token: refreshToken;
}

export interface RefreshResponse {
  access_token: AccessToken;
  refresh_token: AccessToken;
}
