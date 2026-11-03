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
import { useRecordInteraction } from "../hooks/mutations/use-record-interactions";
import type { Movie, MovieInteractionAction } from "../types/movies.type";

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
  const recordMutation = useRecordInteraction();

  const isPick =
    initialAction === "pick_tonight" || initialAction === "watchlist_add";
  const isSeen = initialAction === "seen_before";
  const isSkipped = initialAction === "skipped";
  const isWatched = initialAction === "watched" || movie.is_watched;
  const isLocked = initialAction === "locked_in";
  const isFinalized =
    isPick || isSeen || isSkipped || isWatched || isLocked;

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
          if (action === "pick_tonight") {
            Toast.show({
              type: "success",
              text1: "Picked for Tonight",
              text2: "Head back to lock it in.",
            });
          } else if (action === "seen_before") {
            Toast.show({
              type: "info",
              text1: "Marked as Seen",
              text2: "This card is resolved.",
            });
          } else if (action === "skipped") {
            Toast.show({
              type: "info",
              text1: "Passed for Today",
              text2: "This card is resolved.",
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

  const finalizedIcon = isLocked
    ? "movie-play"
    : isPick
      ? "star"
      : isSeen
        ? "eye-outline"
        : isSkipped
          ? "close-circle-outline"
          : "check-decagram";

  const finalizedIconColor = isLocked || isPick
    ? theme.colors.primary
    : isWatched
      ? theme.colors.success
      : theme.colors.textMuted;

  const finalizedTitle = isLocked
    ? "Locked In for Tonight"
    : isPick
      ? "Picked for Tonight"
      : isSeen
        ? "Already Seen"
        : isSkipped
          ? "Passed for Today"
          : "Marked as Watched";

  const finalizedSubtitle = isLocked
    ? "Tonight's feature is set."
    : isPick
      ? "Head back to lock it in, or pick another."
      : isSeen
        ? "This card is resolved."
        : isSkipped
          ? "This card is resolved."
          : "Saved to your Journal.";

  return (
    <View style={styles.container}>
      {isFinalized ? (
        <View
          style={[
            styles.finalizedCard,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: isLocked || isPick
                ? theme.colors.primary
                : isWatched
                  ? theme.colors.success
                  : theme.colors.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={finalizedIcon}
            size={22}
            color={finalizedIconColor}
          />
          <View style={styles.finalizedTextContainer}>
            <Text
              style={[styles.finalizedTitle, { color: theme.colors.textPrimary }]}
            >
              {finalizedTitle}
            </Text>
            <Text
              style={[
                styles.finalizedSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {finalizedSubtitle}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          {/* Pass */}
          <Pressable
            onPress={() => handleAction("skipped")}
            disabled={!!loadingAction}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.neutralBtn,
              pressed && { opacity: 0.75 },
              loadingAction === "skipped" && styles.btnDisabled,
            ]}
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
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Pass
                </Text>
              </>
            )}
          </Pressable>

          {/* Seen */}
          <Pressable
            onPress={() => handleAction("seen_before")}
            disabled={!!loadingAction}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.neutralBtn,
              pressed && { opacity: 0.75 },
              loadingAction === "seen_before" && styles.btnDisabled,
            ]}
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
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Seen
                </Text>
              </>
            )}
          </Pressable>

          {/* Pick */}
          <Pressable
            onPress={() => handleAction("pick_tonight")}
            disabled={!!loadingAction}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.pickBtn,
              { backgroundColor: theme.colors.primary },
              pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
              loadingAction === "pick_tonight" && styles.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Pick film for tonight"
          >
            {loadingAction === "pick_tonight" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="star" size={17} color="#FFFFFF" />
                <Text style={styles.pickBtnText}>Pick</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    width: "100%",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  neutralBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pickBtn: {
    flex: 1.4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pickBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  finalizedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  finalizedTextContainer: {
    flex: 1,
  },
  finalizedTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  finalizedSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
