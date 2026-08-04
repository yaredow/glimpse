import { useQuery } from "@tanstack/react-query";
import { HTTPError } from "@/lib/ky";
import { type GridMovie } from "../../types/movies.type";
import { moviesKeys } from "../../consants/movies.keys";
import { getTodaysGrid } from "../../services/movie.service";

export const useGetTodaysGrid = () => {
  return useQuery<{ grid: GridMovie[] }, HTTPError>({
    queryKey: moviesKeys.todayGrid(),
    queryFn: getTodaysGrid,
    refetchOnMount: "always",
  });
};
