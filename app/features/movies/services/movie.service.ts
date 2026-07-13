import { api } from "@/lib/api";
import {
  GridMovie,
  MovieDetailResponse,
} from "../types/movies.type";

export const getMovie = async (id: number): Promise<MovieDetailResponse> => {
  return api.get(`v1/movies/${id}`).json<MovieDetailResponse>();
};

export const getTodaysGrid = async () => {
  return api.get("v1/grid/today").json<{ grid: GridMovie[] }>();
};
