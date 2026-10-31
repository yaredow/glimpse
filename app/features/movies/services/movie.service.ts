import { api } from "@/lib/api";
import {
  GridMovie,
  MovieDetailResponse,
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
