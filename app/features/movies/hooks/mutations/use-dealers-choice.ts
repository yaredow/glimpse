import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dealersChoice } from "../../services/movie.service";
import { moviesKeys } from "../../consants/movies.keys";
import type { DealersChoiceResponse } from "../../types/movies.type";

export const useDealersChoice = () => {
  const queryClient = useQueryClient();

  return useMutation<DealersChoiceResponse, Error, void>({
    mutationFn: () => dealersChoice(),
    onSuccess: (data) => {
      queryClient.setQueryData(moviesKeys.todayGrid(), { grid: data.grid });
      queryClient.invalidateQueries({ queryKey: moviesKeys.todayGrid() });
    },
  });
};

