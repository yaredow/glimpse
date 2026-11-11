import { http } from "@/lib/ky";
import {
  getValidAccessToken,
  refreshAccessToken,
} from "@/features/auth/services/token.service";

export const api = http.extend({
  hooks: {
    beforeRequest: [
      async ({ request, options }) => {
        if (__DEV__) {
          console.log("[API]", request.method, request.url);
        }
        if (options.context?.auth !== false) {
          const token = await getValidAccessToken();
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        }
      },
    ],
    afterResponse: [
      async ({ request, options, response, retryCount }) => {
        if (__DEV__) {
          console.log("[API]", response.status, request.url);
        }
        if (
          response.status === 401 &&
          options.context?.auth !== false &&
          retryCount === 0
        ) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            const headers = new Headers(request.headers);
            headers.set("Authorization", `Bearer ${newToken}`);
            const body = await request.clone().arrayBuffer();
            return api.retry({
              request: new Request(request, { headers, body }),
            });
          }
        }
      },
    ],
  },
});
