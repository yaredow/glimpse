import { api } from "@/lib/api";
import {
  DealersChoiceResponse,
  GridMovie,
  HistoryResponse,
  MovieDetailResponse,
  MovieReviewsResponse,
  MovieSourcesResponse,
  RecordInteractionPayload,
} from "../types/movies.type";

export const getMovie = async (id: number): Promise<MovieDetailResponse> => {
  return api.get(`v1/movies/${id}`).json<MovieDetailResponse>();
};

export const getTodaysGrid = async () => {
  return api.get("v1/grid/today").json<{ grid: GridMovie[] }>();
};

export const recordInteraction = (payload: RecordInteractionPayload) => {
  return api
    .post("v1/grid/interactions", { json: payload })
    .json<{ message: string }>();
};

export const syncGrid = async (mood?: string) => {
  return api
    .post("v1/grid/sync", {
      json: mood ? { mood } : {},
    })
    .json<{ grid: GridMovie[]; syncs_remaining: number }>();
};

export const dealersChoice = async (): Promise<DealersChoiceResponse> => {
  return api.post("v1/grid/dealers-choice").json<DealersChoiceResponse>();
};

export const getHistory = async (action?: string) => {
  const searchParams = action ? { action } : undefined;
  return api
    .get("v1/me/history", { searchParams })
    .json<HistoryResponse>();
};

export const getMovieSources = async (id: number): Promise<{ sources: MovieSourcesResponse }> => {
  return api.get(`v1/movies/${id}/sources`).json<{ sources: MovieSourcesResponse }>();
};

export const getMovieReviews = async (id: number): Promise<MovieReviewsResponse> => {
  return api.get(`v1/movies/${id}/reviews`).json<MovieReviewsResponse>();
};
