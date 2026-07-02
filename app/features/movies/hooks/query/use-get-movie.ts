import { useQuery } from "@tanstack/react-query";
import { moviesKeys } from "../../consants/movies.keys";
import { getMovie } from "../../services/movie.service";

export const useGetMovie = (id: number) => {
  return useQuery({
    queryKey: moviesKeys.movie(id),
    queryFn: () => getMovie(id),
    enabled: !!id,
  });
};
