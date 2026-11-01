import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: movie.imdb_id
          ? `Check out "${movie.title}" on IMDb: https://www.imdb.com/title/${movie.imdb_id}`
          : movie.title,
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <View style={styles.container}>
      {isFinalized ? (
        <View style={styles.finalizedContainer}>
          {initialAction === "locked_in" ? (
            <View style={[styles.statusBanner, styles.bannerPick]}>
              <MaterialCommunityIcons name="play-circle" size={16} color="#FFFFFF" />
              <Text style={styles.bannerPickText}>Now Watching 🍿</Text>
            </View>
          ) : initialAction === "pick_tonight" || initialAction === "watchlist_add" ? (
            <View style={[styles.statusBanner, styles.bannerPick]}>
              <MaterialCommunityIcons name="star" size={16} color="#FFFFFF" />
              <Text style={styles.bannerPickText}>Selected as Today&apos;s Pick</Text>
            </View>
          ) : initialAction === "skipped" ? (
            <View style={[styles.statusBanner, styles.bannerSkipped]}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#71717A" />
              <Text style={styles.bannerSkippedText}>Skipped for Today</Text>
            </View>
          ) : (
            <View style={[styles.statusBanner, styles.bannerWatched]}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
              <Text style={styles.bannerWatchedText}>Marked as Watched</Text>
            </View>
          )}

          <Pressable style={styles.shareIconButton} onPress={handleShare}>
            <MaterialCommunityIcons name="share-outline" size={20} color="#999" />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.decisionRow}>
            {/* 1. Skip Button */}
            <Pressable
              style={[
                styles.actionBtn,
                styles.skipBtn,
                loadingAction === "skipped" && styles.btnDisabled,
              ]}
              disabled={!!loadingAction}
              onPress={() => setPendingAction("skipped")}
            >
              {loadingAction === "skipped" ? (
                <ActivityIndicator size="small" color="#999" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={20}
                    color="#999"
                  />
                  <Text style={styles.skipBtnText}>Skip</Text>
                </>
              )}
            </Pressable>

            {/* 2. Watched Button */}
            <Pressable
              style={[
                styles.actionBtn,
                styles.watchedBtn,
                loadingAction === "watched" && styles.btnDisabled,
              ]}
              disabled={!!loadingAction}
              onPress={() => setPendingAction("watched")}
            >
              {loadingAction === "watched" ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.watchedBtnText}>Watched</Text>
                </>
              )}
            </Pressable>

            {/* 3. Today's Pick Button */}
            <Pressable
              style={[
                styles.actionBtn,
                styles.pickBtn,
                loadingAction === "pick_tonight" && styles.btnDisabled,
              ]}
              disabled={!!loadingAction}
              onPress={() => setPendingAction("pick_tonight")}
            >
              {loadingAction === "pick_tonight" ? (
                <ActivityIndicator size="small" color="#121212" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="star"
                    size={18}
                    color="#121212"
                  />
                  <Text style={styles.pickBtnText}>Today&apos;s Pick</Text>
                </>
              )}
            </Pressable>
          </View>

          <Pressable style={styles.secondaryShare} onPress={handleShare}>
            <MaterialCommunityIcons name="share-variant-outline" size={16} color="#777" />
            <Text style={styles.secondaryShareText}>Share Movie</Text>
          </Pressable>
        </>
      )}

      {/* Action Confirmation Modal */}
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
    paddingVertical: 14,
    gap: 12,
  },
  decisionRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  skipBtn: {
    borderColor: "rgba(255,255,255,0.08)",
  },
  skipBtnText: {
    color: "#A1A1AA",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  watchedBtn: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#1e1e1e",
  },
  watchedBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  pickBtn: {
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    flex: 1.3,
  },
  pickBtnText: {
    color: "#121212",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  secondaryShare: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  secondaryShareText: {
    color: "#777",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  finalizedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusBanner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerWatched: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  bannerWatchedText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  bannerSkipped: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  bannerSkippedText: {
    color: "#71717A",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  bannerPick: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.15)",
  },
  bannerPickText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  shareIconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
});
