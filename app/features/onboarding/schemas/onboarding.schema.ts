import { z } from "zod";

export const favoriteGenresSchema = z.object({
  favorite_genres: z.array(z.number()).min(1, "Select at least one genre"),
});

export const eraSchema = z.object({
  min_year: z.number().min(1888),
  max_year: z.number().max(2100),
});

export const languageSchema = z.object({
  languages: z.array(z.string()).min(1, "Select at least one language"),
});

export const ratingSchema = z.object({
  min_rating: z.number().min(0).max(10),
});

export const finishOnboardingSchema = z.object({
  favorite_genres: z.array(z.number()).min(1),
  excluded_genres: z.array(z.number()),
  languages: z.array(z.string()).min(1),
  min_rating: z.number().min(0).max(10),
  min_year: z.number().min(1888),
  max_year: z.number().max(2100),
});
