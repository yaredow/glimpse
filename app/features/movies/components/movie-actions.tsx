import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useAppTheme } from "@/lib/theme";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useRecordInteraction } from "../hooks/mutations/use-record-interactions";
import type { Movie, MovieInteractionAction } from "../types/movies.type";
import ActionConfirmModal, {
  ConfirmableAction,
} from "./action-confirm-modal";

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
  const [loadingAction, setLoadingAction] = useState<MovieInteractionAction | null>(null);
  const [pendingAction, setPendingAction] = useState<Extract<ConfirmableAction, MovieInteractionAction> | null>(null);
  const { data: profileData } = useProfile();
  const syncsRemaining = profileData?.user.syncs_remaining ?? 3;
  const recordMutation = useRecordInteraction();

  const isFinalized =
    initialAction === "watched" ||
    initialAction === "skipped" ||
    initialAction === "watchlist_add" ||
    initialAction === "pick_tonight" ||
    initialAction === "locked_in" ||
    movie.is_watched;

  const handleAction = (action: MovieInteractionAction) => {
    if (loadingAction || !sessionId) return;

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
          if (action === "watched") {
            Toast.show({
              type: "success",
              text1: "Marked as Watched",
              text2: "Added to your watched history.",
            });
          } else if (action === "skipped") {
            Toast.show({
              type: "info",
              text1: "Movie Skipped",
              text2: "Locked in for today.",
            });
          } else if (action === "pick_tonight" || action === "watchlist_add") {
            Toast.show({
              type: "success",
              text1: "Today's Pick! 🍿",
              text2: "Selected as today's feature.",
            });
          } else if (action === "locked_in") {
            Toast.show({
              type: "success",
              text1: "Now Watching! 🍿",
              text2: "Selection locked for today. Enjoy!",
            });
          }
          onActionComplete?.();
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

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    const actionToRun = pendingAction;
    setPendingAction(null);
    handleAction(actionToRun);
  };

  const promptAction = (action: Extract<ConfirmableAction, MovieInteractionAction>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingAction(action);
  };

  return (
    <View style={styles.container}>
      {isFinalized ? (
        <View
          style={[
            styles.finalizedCard,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor:
                initialAction === "locked_in" ||
                initialAction === "pick_tonight" ||
                initialAction === "watchlist_add"
                  ? theme.colors.gold
                  : initialAction === "watched" || movie.is_watched
                  ? theme.colors.success
                  : theme.colors.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={
              initialAction === "locked_in"
                ? "movie-play"
                : initialAction === "pick_tonight" || initialAction === "watchlist_add"
                ? "star"
                : initialAction === "skipped"
                ? "close-circle-outline"
                : "check-decagram"
            }
            size={22}
            color={
              initialAction === "locked_in" ||
              initialAction === "pick_tonight" ||
              initialAction === "watchlist_add"
                ? theme.colors.gold
                : initialAction === "skipped"
                ? theme.colors.textMuted
                : theme.colors.success
            }
          />
          <View style={styles.finalizedTextContainer}>
            <Text
              style={[styles.finalizedTitle, { color: theme.colors.textPrimary }]}
            >
              {initialAction === "locked_in"
                ? "Locked In for Tonight"
                : initialAction === "pick_tonight" || initialAction === "watchlist_add"
                ? "Selected as Today's Pick"
                : initialAction === "skipped"
                ? "Skipped for Today"
                : "Marked as Watched"}
            </Text>
            <Text
              style={[styles.finalizedSubtitle, { color: theme.colors.textSecondary }]}
            >
              {initialAction === "locked_in"
                ? "Tonight's feature film selection is locked."
                : initialAction === "pick_tonight" || initialAction === "watchlist_add"
                ? "Head back to lock in your feature film."
                : initialAction === "skipped"
                ? "Reel closed for today's rotation."
                : "Saved to your journal and watch history."}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          <Pressable
            onPress={() => promptAction("pick_tonight")}
            disabled={!!loadingAction}
            style={({ pressed }) => [
              styles.heroPickBtn,
              { backgroundColor: theme.colors.gold },
              pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
              loadingAction === "pick_tonight" && styles.btnDisabled,
            ]}
          >
            {loadingAction === "pick_tonight" ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <>
                <MaterialCommunityIcons name="star" size={19} color="#121212" />
                <Text style={styles.heroPickBtnText}>PICK AS TODAY&apos;S FILM</Text>
              </>
            )}
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              onPress={() => promptAction("watched")}
              disabled={!!loadingAction}
              style={({ pressed }) => [
                styles.secondaryBtn,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outlineVariant,
                },
                pressed && { opacity: 0.8 },
                loadingAction === "watched" && styles.btnDisabled,
              ]}
            >
              {loadingAction === "watched" ? (
                <ActivityIndicator size="small" color={theme.colors.success} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={18}
                    color={theme.colors.success}
                  />
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Mark Watched
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => promptAction("skipped")}
              disabled={!!loadingAction}
              style={({ pressed }) => [
                styles.secondaryBtn,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outlineVariant,
                },
                pressed && { opacity: 0.8 },
                loadingAction === "skipped" && styles.btnDisabled,
              ]}
            >
              {loadingAction === "skipped" ? (
                <ActivityIndicator size="small" color={theme.colors.textMuted} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={18}
                    color={theme.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Skip Movie
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      )}

      <ActionConfirmModal
        visible={pendingAction !== null}
        action={pendingAction}
        movieTitle={movie.title}
        syncsRemaining={syncsRemaining}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionsContainer: {
    gap: 10,
  },
  heroPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  heroPickBtnText: {
    color: "#121212",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.6,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  finalizedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  finalizedTextContainer: {
    flex: 1,
  },
  finalizedTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  finalizedSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
