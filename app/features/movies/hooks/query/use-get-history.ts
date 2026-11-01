import { useQuery } from "@tanstack/react-query";
import { HTTPError } from "@/lib/ky";
import { type HistoryMovie } from "../../types/movies.type";
import { moviesKeys } from "../../consants/movies.keys";
import { getHistory } from "../../services/movie.service";

export const useGetHistory = (action?: string) => {
  return useQuery<{ history: HistoryMovie[] }, HTTPError>({
    queryKey: moviesKeys.history(action),
    queryFn: () => getHistory(action),
    refetchOnMount: "always",
  });
};

