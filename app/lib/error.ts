import { HTTPError } from "@/lib/ky";

export async function getErrorMessage(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = await error.response.clone().json<{ error?: string }>();
      if (body.error) return body.error;
    } catch {}
  }

  if (error instanceof Error) return error.message;

  return "An unexpected error occurred";
}
