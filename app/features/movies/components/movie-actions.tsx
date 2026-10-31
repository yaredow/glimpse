import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
  const [showPickConfirm, setShowPickConfirm] = useState(false);
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
              text1: "Tonight's Pick! 🍿",
              text2: "Selected as tonight's feature.",
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
              <MaterialCommunityIcons name="play-circle" size={16} color="#f59e0b" />
              <Text style={styles.bannerPickText}>Now Watching 🍿</Text>
            </View>
          ) : initialAction === "pick_tonight" || initialAction === "watchlist_add" ? (
            <View style={[styles.statusBanner, styles.bannerPick]}>
              <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
              <Text style={styles.bannerPickText}>Selected as Tonight&apos;s Pick</Text>
            </View>
          ) : initialAction === "skipped" ? (
            <View style={[styles.statusBanner, styles.bannerSkipped]}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#ef4444" />
              <Text style={styles.bannerSkippedText}>Skipped for Today</Text>
            </View>
          ) : (
            <View style={[styles.statusBanner, styles.bannerWatched]}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#22c55e" />
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
              onPress={() => handleAction("skipped")}
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
              onPress={() => handleAction("watched")}
            >
              {loadingAction === "watched" ? (
                <ActivityIndicator size="small" color="#22c55e" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={20}
                    color="#22c55e"
                  />
                  <Text style={styles.watchedBtnText}>Watched</Text>
                </>
              )}
            </Pressable>

            {/* 3. Tonight's Pick Button */}
            <Pressable
              style={[
                styles.actionBtn,
                styles.pickBtn,
                loadingAction === "pick_tonight" && styles.btnDisabled,
              ]}
              disabled={!!loadingAction}
              onPress={() => setShowPickConfirm(true)}
            >
              {loadingAction === "pick_tonight" ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="star"
                    size={18}
                    color="#f59e0b"
                  />
                  <Text style={styles.pickBtnText}>Tonight&apos;s Pick</Text>
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

      {/* Tonight's Pick Confirmation Modal */}
      <Modal
        visible={showPickConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPickConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="star" size={28} color="#f59e0b" />
            </View>

            <Text style={styles.modalTitle}>Make this Tonight&apos;s Feature?</Text>

            <Text style={styles.modalBody}>
              You have <Text style={styles.modalHighlight}>{syncsRemaining} {syncsRemaining === 1 ? "sync" : "syncs"}</Text> remaining today. You can still sync another set if you change your mind, or lock this in as your final watch.
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowPickConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Keep Browsing</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={() => {
                  setShowPickConfirm(false);
                  handleAction("pick_tonight");
                }}
              >
                <Text style={styles.modalConfirmText}>Confirm Pick</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    color: "#ccc",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  watchedBtn: {
    borderColor: "rgba(34,197,94,0.3)",
    backgroundColor: "rgba(34,197,94,0.08)",
  },
  watchedBtnText: {
    color: "#22c55e",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  pickBtn: {
    borderColor: "rgba(245,158,11,0.4)",
    backgroundColor: "rgba(245,158,11,0.12)",
    flex: 1.3,
  },
  pickBtnText: {
    color: "#f59e0b",
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
    backgroundColor: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.3)",
  },
  bannerWatchedText: {
    color: "#22c55e",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  bannerSkipped: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.3)",
  },
  bannerSkippedText: {
    color: "#ef4444",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  bannerPick: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.4)",
  },
  bannerPickText: {
    color: "#f59e0b",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalDialog: {
    width: "100%",
    backgroundColor: "#1c1c1e",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    gap: 12,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  modalBody: {
    color: "#bbb",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  modalHighlight: {
    color: "#f59e0b",
    fontFamily: "Inter_700Bold",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  modalCancelText: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modalConfirmBtn: {
    backgroundColor: "#f59e0b",
  },
  modalConfirmText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
