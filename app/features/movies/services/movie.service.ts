import { api } from "@/lib/api";
import {
  Movie,
  GridMovie,
} from "../types/movies.type";

export const getMovie = async (id: number) => {
  return api.get(`v1/movies/${id}`).json<{ movie: Movie }>();
};

export const getTodaysGrid = async () => {
  return api.get("v1/grid/today").json<{ grid: GridMovie[] }>();
};
