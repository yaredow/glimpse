import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordInteraction } from "../../services/movie.service";
import { moviesKeys } from "../../consants/movies.keys";

export const useRecordInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordInteraction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moviesKeys.todayGrid() });
    },
  });
};
