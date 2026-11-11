export function firstFieldError(errors: unknown): string | undefined {
  if (!Array.isArray(errors)) return undefined;

  for (const error of errors) {
    if (typeof error === "string" && error.trim()) {
      return error;
    }

    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      const message = (error as { message: string }).message.trim();
      if (message) return message;
    }
  }

  return undefined;
}
