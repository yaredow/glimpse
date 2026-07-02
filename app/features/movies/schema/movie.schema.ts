import { z } from "zod";

export const createMovieSchema = z.object({
  title: z.string().min(1, "Title is required"),
  year: z.number().int().min(1888).max(2100).optional(),
  runtime: z.string().optional(),
  genres: z.array(z.string()).optional(),
});

export type CreateMovieFormData = z.infer<typeof createMovieSchema>;
export type CreateMovieFormInput = z.input<typeof createMovieSchema>;
