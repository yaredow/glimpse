import ky from "ky";
import Constants from "expo-constants";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl ?? "";

export { HTTPError } from "ky";

export const http = ky.create({
  prefix: BASE_URL,
});
