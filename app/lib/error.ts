import { HTTPError, isHTTPError } from "@/lib/ky";

export async function getErrorMessage(error: unknown): Promise<string> {
  if (isHTTPError(error) || error instanceof HTTPError) {
    // Ky v1+ automatically pre-parses the response body into error.data
    const data = error.data as Record<string, unknown> | string | undefined;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
    }

    // Fallback: If error.data wasn't populated, attempt reading from response safely
    try {
      if (error.response && !error.response.bodyUsed) {
        const body = (await error.response.json()) as {
          error?: string;
          message?: string;
        };
        if (body?.message) return body.message;
        if (body?.error) return body.error;
      }
    } catch {}
  }

  // Handle duck-typed error objects
  const maybeError = error as { data?: unknown };
  if (maybeError?.data && typeof maybeError.data === "object") {
    const d = maybeError.data as Record<string, unknown>;
    if (typeof d.message === "string" && d.message.trim()) return d.message;
    if (typeof d.error === "string" && d.error.trim()) return d.error;
  }

  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "An unexpected error occurred";
}
