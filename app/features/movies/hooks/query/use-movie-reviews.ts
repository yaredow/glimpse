import { useQuery } from "@tanstack/react-query";
import { moviesKeys } from "../../consants/movies.keys";
import { getMovieReviews } from "../../services/movie.service";

export const useMovieReviews = (id: number, enabled = true) => {
  return useQuery({
    queryKey: moviesKeys.reviews(id),
    queryFn: () => getMovieReviews(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};
