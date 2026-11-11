import ky from "ky";
import Constants from "expo-constants";

const rawUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "http://10.0.2.2:4000";

const BASE_URL = rawUrl.endsWith("/") ? rawUrl : `${rawUrl}/`;

if (__DEV__) {
  console.log("[API] base url:", BASE_URL);
}

export { HTTPError, isHTTPError } from "ky";

export const http = ky.create({
  prefix: BASE_URL,
  timeout: 15000,
});
