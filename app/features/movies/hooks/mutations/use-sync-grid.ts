import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncGrid } from "../../services/movie.service";
import { moviesKeys } from "../../consants/movies.keys";
import { profileKeys } from "@/features/profile/hooks/use-profile";

export const useSyncGrid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncGrid,
    onSuccess: (data) => {
      queryClient.setQueryData(moviesKeys.todayGrid(), { grid: data.grid });
      queryClient.invalidateQueries({ queryKey: moviesKeys.todayGrid() });
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
};

