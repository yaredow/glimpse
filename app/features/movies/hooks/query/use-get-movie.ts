import { useQuery } from "@tanstack/react-query";
import { moviesKeys } from "../../constants/movies.keys";
import { getMovie } from "../../services/movie.service";

export const useGetMovie = (id: number) => {
  return useQuery({
    queryKey: moviesKeys.movie(id),
    queryFn: () => getMovie(id),
    enabled: !!id,
  });
};
