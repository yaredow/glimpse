import { useQuery } from "@tanstack/react-query";
import { moviesKeys } from "../../consants/movies.keys";
import { getMovieSources } from "../../services/movie.service";

export const useMovieSources = (id: number, enabled = true) => {
  return useQuery({
    queryKey: moviesKeys.sources(id),
    queryFn: () => getMovieSources(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60 * 60,
  });
};

