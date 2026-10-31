import { HTTPError } from "@/lib/ky";

export async function getErrorMessage(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.clone().json()) as {
        error?: string;
        message?: string;
      };
      if (body.error) return body.error;
      if (body.message) return body.message;
    } catch {}
  }

  if (error instanceof Error) return error.message;

  return "An unexpected error occurred";
}
