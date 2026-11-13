import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordInteraction } from "../../services/movie.service";
import { moviesKeys } from "../../constants/movies.keys";
import { isJournalAction } from "../../utils/deck";
import type { GridMovie } from "../../types/movies.type";

type TodayGrid = { grid: GridMovie[] };

export const useRecordInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordInteraction,
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<TodayGrid>(
        moviesKeys.todayGrid(),
        (previous) =>
          previous
            ? {
                ...previous,
                grid: previous.grid.map((movie) =>
                  movie.movie_id === variables.movie_id
                    ? { ...movie, action: variables.action }
                    : movie,
                ),
              }
            : previous,
      );
      queryClient.invalidateQueries({ queryKey: moviesKeys.todayGrid() });
      if (isJournalAction(variables.action)) {
        queryClient.invalidateQueries({
          queryKey: moviesKeys.historyRoot(),
          refetchType: "all",
        });
      }
    },
  });
};
