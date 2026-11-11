import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useAppTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useRecordInteraction } from "../hooks/mutations/use-record-interactions";
import type { Movie, MovieInteractionAction } from "../types/movies.type";
import { palette } from "@/lib/theme/colors";

interface MovieActionsProps {
  movie: Movie;
  sessionId?: string;
  slot?: number;
  initialAction?: MovieInteractionAction | null;
  onActionComplete?: () => void;
}

export default function MovieActions({
  movie,
  sessionId,
  slot,
  initialAction,
  onActionComplete,
}: MovieActionsProps) {
  const theme = useAppTheme();
  const [loadingAction, setLoadingAction] =
    useState<MovieInteractionAction | null>(null);
  const [currentAction, setCurrentAction] =
    useState<MovieInteractionAction | null>(initialAction ?? null);
  const recordMutation = useRecordInteraction();

  const isPick =
    currentAction === "pick_tonight" || currentAction === "watchlist_add";
  const isSeen = currentAction === "seen_before";
  const isSkipped = currentAction === "skipped";
  const isWatched = currentAction === "watched" || movie.is_watched;
  const isLocked = currentAction === "locked_in";
  const isFinalized = isLocked || isSeen || isSkipped || isWatched;

  const handleAction = (action: MovieInteractionAction) => {
    if (loadingAction || !sessionId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingAction(action);
    recordMutation.mutate(
      {
        movie_id: movie.id,
        action,
        grid_session_id: sessionId,
        grid_position: slot,
      },
      {
        onSuccess: () => {
          setLoadingAction(null);
          setCurrentAction(action);

          if (action === "pick_tonight") {
            Toast.show({
              type: "success",
              text1: "Tonight's Feature",
              text2: `"${movie.title}" is picked. Lock it in when you're ready.`,
            });
          } else if (action === "revealed") {
            Toast.show({
              type: "info",
              text1: "Pick Removed",
              text2: `"${movie.title}" is no longer tonight's pick.`,
            });
          } else if (action === "seen_before") {
            Toast.show({
              type: "info",
              text1: "Marked as Seen",
              text2: "This card is resolved.",
            });
            onActionComplete?.();
          } else if (action === "skipped") {
            Toast.show({
              type: "info",
              text1: "Passed for Today",
              text2: "This card is resolved.",
            });
            onActionComplete?.();
          }
        },
        onError: (err) => {
          setLoadingAction(null);
          Toast.show({
            type: "error",
            text1: "Action failed",
            text2: err.message,
          });
        },
      },
    );
  };

  const finalizedIcon = isLocked
    ? "movie-play"
    : isSeen
      ? "eye-outline"
      : isSkipped
        ? "close-circle-outline"
        : "check-decagram";

  const finalizedIconColor = isLocked
    ? theme.colors.primary
    : isWatched
      ? theme.colors.success
      : theme.colors.textMuted;

  const finalizedTitle = isLocked
    ? "Locked In for Tonight"
    : isSeen
      ? "Already Seen"
      : isSkipped
        ? "Passed for Today"
        : "Marked as Watched";

  const finalizedSubtitle = isLocked
    ? "Tonight's feature is set."
    : isSeen
      ? "This card is resolved."
      : isSkipped
        ? "This card is resolved."
        : "Saved to your Journal.";

  return (
    <View className="px-4 pt-1 pb-3.5">
      {isFinalized ? (
        <View
          className={cn(
            "flex-row items-center gap-3 rounded-[14px] border px-4 py-3",
            isLocked
              ? "border-primary bg-surface-zinc-900"
              : isWatched
                ? "border-emerald-500 bg-surface-zinc-900"
                : "border-white/[0.08] bg-surface-zinc-900",
          )}
        >
          <MaterialCommunityIcons
            name={finalizedIcon}
            size={22}
            color={finalizedIconColor}
          />
          <View className="flex-1">
            <Text className="text-[13.5px] font-brandBold text-white">
              {finalizedTitle}
            </Text>
            <Text className="mt-0.5 text-[12px] leading-4 text-zinc-400">
              {finalizedSubtitle}
            </Text>
          </View>
        </View>
      ) : (
        <View className="w-full flex-row items-center justify-between gap-2.5">
          {/* Pass */}
          <Pressable
            onPress={() => handleAction("skipped")}
            disabled={!!loadingAction}
            className={cn(
              "h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] active:opacity-75",
              loadingAction === "skipped" && "opacity-55",
            )}
            accessibilityRole="button"
            accessibilityLabel="Pass this film for today"
          >
            {loadingAction === "skipped" ? (
              <ActivityIndicator size="small" color={theme.colors.textMuted} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="close"
                  size={17}
                  color={theme.colors.textMuted}
                />
                <Text className="text-[13px] font-brandSemiBold text-zinc-400">
                  Pass
                </Text>
              </>
            )}
          </Pressable>

          {/* Seen */}
          <Pressable
            onPress={() => handleAction("seen_before")}
            disabled={!!loadingAction}
            className={cn(
              "h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] active:opacity-75",
              loadingAction === "seen_before" && "opacity-55",
            )}
            accessibilityRole="button"
            accessibilityLabel="Mark film as already seen"
          >
            {loadingAction === "seen_before" ? (
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="eye-outline"
                  size={17}
                  color={theme.colors.textPrimary}
                />
                <Text className="text-[13px] font-brandSemiBold text-white">
                  Seen
                </Text>
              </>
            )}
          </Pressable>

          {/* Pick / Picked */}
          <Pressable
            onPress={() => handleAction(isPick ? "revealed" : "pick_tonight")}
            disabled={!!loadingAction}
            className={cn(
              "h-11 flex-[1.4] flex-row items-center justify-center gap-1.5 rounded-lg active:opacity-90 active:scale-[0.99]",
              isPick ? "bg-primary-hover" : "bg-primary",
              (loadingAction === "pick_tonight" ||
                loadingAction === "revealed") &&
                "opacity-55",
            )}
            accessibilityRole="button"
            accessibilityLabel={
              isPick ? "Remove from tonight's pick" : "Pick film for tonight"
            }
          >
            {loadingAction === "pick_tonight" ||
            loadingAction === "revealed" ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={isPick ? "check-circle" : "star"}
                  size={17}
                  color={palette.white}
                />
                <Text className="text-[13px] tracking-[0.4px] font-brandBold text-white">
                  {isPick ? "Picked" : "Pick"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
