import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useAppTheme } from "@/lib/theme";
import { useGetTodaysGrid } from "@/features/movies/hooks/query/use-today-grid";
import { useRecordInteraction } from "@/features/movies/hooks/mutations/use-record-interactions";
import { useSyncGrid } from "@/features/movies/hooks/mutations/use-sync-grid";
import { useDealersChoice } from "@/features/movies/hooks/mutations/use-dealers-choice";
import { useProfile } from "@/features/profile/hooks/use-profile";
import type { GridMovie } from "@/features/movies/types/movies.type";
import ExploreHeader from "@/features/movies/components/explore-header";
import DeckStack from "@/features/movies/components/deck-stack";
import SkeletonLoader from "@/features/movies/components/skeleton-loader";
import ActionConfirmModal, {
  ConfirmableAction,
  SyncMood,
} from "@/features/movies/components/action-confirm-modal";
import ShowtimeHub from "@/features/movies/components/showtime-hub";
import { isResolvedAction } from "@/features/movies/utils/deck";
import { deriveProgramTheme } from "@/features/movies/utils/program";

export default function TodayTab() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data, isPending } = useGetTodaysGrid();
  const { data: profileData } = useProfile();
  const syncsRemaining = profileData?.user.syncs_remaining ?? 3;
  const recordInteraction = useRecordInteraction();
  const syncMutation = useSyncGrid();
  const dealersChoiceMutation = useDealersChoice();
  const [isLockingIn, setIsLockingIn] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedMood, setSelectedMood] = useState<SyncMood | undefined>(undefined);

  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    action: ConfirmableAction | null;
    movie: GridMovie | null;
  }>({
    visible: false,
    action: null,
    movie: null,
  });

  const movies = useMemo(() => data?.grid ?? [], [data?.grid]);

  const programTheme = useMemo(
    () => deriveProgramTheme(movies, selectedMood),
    [movies, selectedMood],
  );

  const pickCandidates = movies.filter(
    (m) =>
      Boolean(m.is_locked_in) ||
      m.action === "locked_in" ||
      m.action === "pick_tonight" ||
      m.action === "watchlist_add",
  );
  const lockedPick = pickCandidates.find(
    (m) => Boolean(m.is_locked_in) || m.action === "locked_in",
  );
  const latestPick = pickCandidates
    .filter((m) => !Boolean(m.is_locked_in) && m.action !== "locked_in")
    .sort(
      (a, b) =>
        new Date(b.action_at ?? 0).getTime() -
        new Date(a.action_at ?? 0).getTime(),
    )[0];
  const tonightPick = lockedPick ?? latestPick;
  const currentPickId = tonightPick?.movie_id;
  const isShowtimeMode =
    Boolean(tonightPick?.is_locked_in) || tonightPick?.action === "locked_in";

  const getInitialIndex = () => {
    if (movies.length === 0) return 0;
    if (tonightPick) {
      const pickIdx = movies.findIndex(
        (m) => m.movie_id === tonightPick.movie_id,
      );
      if (pickIdx >= 0) return pickIdx;
    }
    const firstUnresolved = movies.findIndex(
      (m) => !isResolvedAction(m.action),
    );
    return firstUnresolved >= 0 ? firstUnresolved : 0;
  };

  const [activeIndex, setActiveIndex] = useState(getInitialIndex);

  // Track session ID so when a fresh batch is synced, activeIndex resets to 0
  const currentSessionId = movies[0]?.grid_session_id;
  const [prevSessionId, setPrevSessionId] = useState(currentSessionId);

  if (currentSessionId && currentSessionId !== prevSessionId) {
    setPrevSessionId(currentSessionId);
    const firstUnresolved = movies.findIndex(
      (m) => !isResolvedAction(m.action),
    );
    setActiveIndex(firstUnresolved >= 0 ? firstUnresolved : 0);
  }

  // Reactive Auto-Advancement: If the active movie was resolved externally
  // (e.g. passed/seen from detail screen), adjust index during render to the next unresolved card.
  const currentCard = movies[activeIndex];
  if (currentCard && isResolvedAction(currentCard.action)) {
    const nextUnresolved = movies.findIndex(
      (m, idx) => idx >= activeIndex && !isResolvedAction(m.action),
    );
    if (nextUnresolved >= 0) {
      setActiveIndex(nextUnresolved);
    } else {
      const anyUnresolved = movies.findIndex(
        (m) => !isResolvedAction(m.action),
      );
      if (anyUnresolved >= 0) {
        setActiveIndex(anyUnresolved);
      } else {
        setActiveIndex(movies.length);
      }
    }
  }

  const isDeckCompleted =
    movies.length > 0 &&
    (activeIndex >= movies.length ||
      movies.every((m) => isResolvedAction(m.action)));

  const activeDeckMovie = !isDeckCompleted ? movies[activeIndex] : undefined;

  const isViewingTonightPick =
    tonightPick &&
    (activeIndex >= movies.length ||
      (activeDeckMovie && activeDeckMovie.movie_id === tonightPick.movie_id));

  const handleReveal = useCallback(
    (movie: GridMovie) => {
      if (!movie.grid_session_id) return;

      const isAlreadyRevealed =
        Boolean(movie.is_revealed) || movie.action === "revealed";
      if (!isAlreadyRevealed) {
        recordInteraction.mutate({
          movie_id: movie.movie_id,
          action: "revealed",
          grid_session_id: movie.grid_session_id,
          grid_position: movie.slot_number,
        });
      }
    },
    [recordInteraction],
  );

  const handleViewMovie = useCallback(
    (movie: GridMovie, allowWatched = false) => {
      if (
        !allowWatched &&
        (movie.action === "skipped" ||
          movie.action === "watched" ||
          movie.action === "seen_before")
      ) {
        Toast.show({
          type: "info",
          text1: "Reel Locked",
          text2:
            movie.action === "skipped"
              ? "This movie was passed for today."
              : movie.action === "seen_before"
                ? "You already marked this as seen."
                : "This movie was marked as watched.",
        });
        return;
      }

      router.push({
        pathname: "/(app)/movies/[id]",
        params: {
          id: movie.movie_id,
          sessionId: movie.grid_session_id ?? "",
          slot: movie.slot_number,
          action: movie.action ?? "",
        },
      });
    },
    [],
  );

  const handleLogWatched = useCallback(
    (movie: GridMovie, rating: number) => {
      if (!movie.grid_session_id) return;
      recordInteraction.mutate(
        {
          movie_id: movie.movie_id,
          action: "watched",
          grid_session_id: movie.grid_session_id,
          grid_position: movie.slot_number,
          rating,
        },
        {
          onSuccess: () => {
            Toast.show({
              type: "success",
              text1: "Verdict Logged! 🍿",
              text2: `Rated ${rating} ★ · "${movie.title}" added to your Journal.`,
            });
          },
          onError: (err) => {
            Toast.show({
              type: "error",
              text1: "Action failed",
              text2: err.message,
            });
          },
        },
      );
    },
    [recordInteraction],
  );

  const handlePick = useCallback(
    (movie: GridMovie) => {
      if (!movie.grid_session_id || recordInteraction.isPending) return;

      const isAlreadyPicked = currentPickId === movie.movie_id;

      if (isAlreadyPicked) {
        // Toggle off / Unpick
        recordInteraction.mutate(
          {
            movie_id: movie.movie_id,
            action: "revealed",
            grid_session_id: movie.grid_session_id,
            grid_position: movie.slot_number,
          },
          {
            onSuccess: () => {
              Toast.show({
                type: "info",
                text1: "Pick Removed",
                text2: `"${movie.title}" is no longer tonight's pick.`,
              });
            },
            onError: (err) => {
              Toast.show({
                type: "error",
                text1: "Action failed",
                text2: err.message,
              });
            },
          },
        );

        // Also clean up any lingering tentative picks in movies
        const otherPicks = movies.filter(
          (m) =>
            m.movie_id !== movie.movie_id &&
            !m.is_locked_in &&
            m.action !== "locked_in" &&
            (m.action === "pick_tonight" || m.action === "watchlist_add"),
        );
        for (const other of otherPicks) {
          if (other.grid_session_id) {
            recordInteraction.mutate({
              movie_id: other.movie_id,
              action: "revealed",
              grid_session_id: other.grid_session_id,
              grid_position: other.slot_number,
            });
          }
        }
      } else {
        // Pick tonight
        recordInteraction.mutate(
          {
            movie_id: movie.movie_id,
            action: "pick_tonight",
            grid_session_id: movie.grid_session_id,
            grid_position: movie.slot_number,
          },
          {
            onSuccess: () => {
              Toast.show({
                type: "success",
                text1: "Tonight's Feature",
                text2: `"${movie.title}" is picked. Lock it in when you're ready.`,
              });
            },
            onError: (err) => {
              Toast.show({
                type: "error",
                text1: "Action failed",
                text2: err.message,
              });
            },
          },
        );

        // Demote previous tentative pick so there's always at most one pick
        const otherPicks = movies.filter(
          (m) =>
            m.movie_id !== movie.movie_id &&
            !m.is_locked_in &&
            m.action !== "locked_in" &&
            (m.action === "pick_tonight" || m.action === "watchlist_add"),
        );
        for (const other of otherPicks) {
          if (other.grid_session_id) {
            recordInteraction.mutate({
              movie_id: other.movie_id,
              action: "revealed",
              grid_session_id: other.grid_session_id,
              grid_position: other.slot_number,
            });
          }
        }
      }
    },
    [movies, currentPickId, recordInteraction],
  );

  const handleSeen = useCallback(
    (movie: GridMovie) => {
      if (!movie.grid_session_id) return;
      recordInteraction.mutate(
        {
          movie_id: movie.movie_id,
          action: "seen_before",
          grid_session_id: movie.grid_session_id,
          grid_position: movie.slot_number,
        },
        {
          onSuccess: () => {
            Toast.show({
              type: "info",
              text1: "Marked as Seen",
              text2: `"${movie.title}" is resolved.`,
            });
          },
          onError: (err) => {
            Toast.show({
              type: "error",
              text1: "Action failed",
              text2: err.message,
            });
          },
        },
      );
    },
    [recordInteraction],
  );

  const handleSkip = useCallback(
    (movie: GridMovie) => {
      if (!movie.grid_session_id) return;
      recordInteraction.mutate(
        {
          movie_id: movie.movie_id,
          action: "skipped",
          grid_session_id: movie.grid_session_id,
          grid_position: movie.slot_number,
        },
        {
          onSuccess: () => {
            Toast.show({
              type: "info",
              text1: "Passed for Today",
              text2: `"${movie.title}" is resolved.`,
            });
          },
          onError: (err) => {
            Toast.show({
              type: "error",
              text1: "Action failed",
              text2: err.message,
            });
          },
        },
      );
    },
    [recordInteraction],
  );

  const handlePromptLockIn = useCallback(() => {
    if (!tonightPick || isLockingIn) return;
    setConfirmDialog({ visible: true, action: "locked_in", movie: tonightPick });
  }, [isLockingIn, tonightPick]);

  const handlePromptSync = useCallback(() => {
    if (syncsRemaining <= 0 || syncMutation.isPending) {
      Toast.show({
        type: "info",
        text1: "No Syncs Remaining",
        text2: "You have used all 3 syncs for today.",
      });
      return;
    }
    setConfirmDialog({ visible: true, action: "sync", movie: null });
  }, [syncsRemaining, syncMutation.isPending]);

  const handleReturnToPick = useCallback(() => {
    if (!tonightPick) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const pickIdx = movies.findIndex(
      (m) => m.movie_id === tonightPick.movie_id,
    );
    if (pickIdx >= 0) {
      setActiveIndex(pickIdx);
    }
  }, [movies, tonightPick]);

  const handleKeepBrowsing = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const otherIdx = movies.findIndex(
      (m, idx) => idx !== activeIndex && !isResolvedAction(m.action),
    );
    if (otherIdx >= 0) {
      setActiveIndex(otherIdx);
    } else {
      setActiveIndex((activeIndex + 1) % Math.max(movies.length, 1));
    }
  }, [movies, activeIndex]);

  const handleDealersChoice = useCallback(() => {
    if (dealersChoiceMutation.isPending || isShuffling) return;

    setIsShuffling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const timer1 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 160);
    const timer2 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 340);
    const timer3 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 500);

    const startTime = Date.now();

    dealersChoiceMutation.mutate(undefined, {
      onSuccess: (res) => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 680 - elapsed);

        setTimeout(() => {
          setIsShuffling(false);
          const targetIdx = res.grid.findIndex(
            (m) => m.movie_id === res.movie.movie_id,
          );
          if (targetIdx >= 0) {
            setActiveIndex(targetIdx);
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Toast.show({
            type: "success",
            text1: "Dealer's Choice 🎲",
            text2: `We picked "${res.movie.title}" for tonight. Lock it in when you're ready!`,
          });
        }, remaining);
      },
      onError: (err) => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setIsShuffling(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: "Dealer's Choice",
          text2: err.message || "Failed to pick candidate.",
        });
      },
    });
  }, [dealersChoiceMutation, isShuffling]);

  const handleConfirmDialogAction = useCallback(
    (mood?: SyncMood) => {
      const { action, movie } = confirmDialog;
      setConfirmDialog({ visible: false, action: null, movie: null });

      if (action === "sync") {
        setSelectedMood(mood);
        syncMutation.mutate(mood, {
          onSuccess: (res) => {
            Toast.show({
              type: "success",
              text1: "Fresh Batch Synced",
              text2: `${res.syncs_remaining} ${res.syncs_remaining === 1 ? "sync" : "syncs"} remaining today.`,
            });
          },
          onError: (err) => {
            Toast.show({
              type: "error",
              text1: "Sync Failed",
              text2: err.message,
            });
          },
        });
        return;
      }

      if (action !== "locked_in" || !movie || !movie.grid_session_id) return;

      setIsLockingIn(true);
      recordInteraction.mutate(
        {
          movie_id: movie.movie_id,
          action: "locked_in",
          grid_session_id: movie.grid_session_id,
          grid_position: movie.slot_number,
        },
        {
          onSuccess: () => {
            setIsLockingIn(false);
            Toast.show({
              type: "success",
              text1: "Now Watching",
              text2: "Selection locked for today. Enjoy the show!",
            });
          },
          onError: (err) => {
            setIsLockingIn(false);
            Toast.show({
              type: "error",
              text1: "Failed to lock in",
              text2: err.message,
            });
          },
        },
      );
    },
    [confirmDialog, recordInteraction, syncMutation],
  );

  if (!isPending && isShowtimeMode && tonightPick) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <ShowtimeHub
          movie={tonightPick}
          onLogWatched={handleLogWatched}
          onOpenDetails={(m) => handleViewMovie(m, true)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ExploreHeader
        syncsRemaining={syncsRemaining}
        onSyncPress={handlePromptSync}
        isSyncing={syncMutation.isPending}
        programTheme={programTheme}
      />

      <View
        style={[
          styles.mainContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 64 },
        ]}
      >
        {isPending ? (
          <View style={styles.deckContainer}>
            <SkeletonLoader count={5} />
          </View>
        ) : (
          <View style={styles.deckContainer}>
            <DeckStack
              movies={movies}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              currentPickId={currentPickId}
              syncsRemaining={syncsRemaining}
              onReveal={handleReveal}
              onPickTonight={handlePick}
              onSeen={handleSeen}
              onSkip={handleSkip}
              onViewDetails={handleViewMovie}
              onReshuffle={handlePromptSync}
              onDealersChoice={handleDealersChoice}
              isDealersChoiceLoading={dealersChoiceMutation.isPending}
              isShuffling={isShuffling}
            />
          </View>
        )}

        {tonightPick ? (
          <View style={styles.bottomDock}>
            {tonightPick.action !== "locked_in" ? (
              isViewingTonightPick ? (
                <View style={styles.dockColumn}>
                  <Pressable
                    onPress={handlePromptLockIn}
                    style={({ pressed }) => [
                      styles.lockInPill,
                      { backgroundColor: theme.colors.primary },
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Lock in ${tonightPick.title}`}
                  >
                    <MaterialCommunityIcons
                      name="movie-play-outline"
                      size={17}
                      color="#FFFFFF"
                    />
                    <Text style={styles.lockInPillText} numberOfLines={1}>
                      LOCK IN &quot;{tonightPick.title.toUpperCase()}&quot;
                    </Text>
                  </Pressable>

                  {tonightPick.is_dealers_choice ? (
                    <Pressable
                      onPress={handleKeepBrowsing}
                      style={({ pressed }) => [
                        styles.browseOthersLink,
                        pressed && { opacity: 0.6 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Browse other movies in this batch"
                      hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
                    >
                      <Text
                        style={[
                          styles.browseOthersLinkText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Browse other movies
                      </Text>
                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={14}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <Pressable
                  onPress={handleReturnToPick}
                  style={({ pressed }) => [
                    styles.lockInPill,
                    styles.returnPill,
                    {
                      backgroundColor: theme.colors.elevation.level2,
                      borderColor: theme.colors.outlineVariant,
                    },
                    pressed && {
                      opacity: 0.85,
                      backgroundColor: theme.colors.elevation.level3,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    tonightPick.is_dealers_choice
                      ? "Return to recommendation"
                      : `Return to ${tonightPick.title}`
                  }
                >
                  <MaterialCommunityIcons
                    name="arrow-u-left-top"
                    size={17}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.lockInPillText,
                      { color: theme.colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {tonightPick.is_dealers_choice
                      ? "RETURN TO RECOMMENDATION"
                      : `RETURN TO "${tonightPick.title.toUpperCase()}"`}
                  </Text>
                </Pressable>
              )
            ) : (
              <View
                style={[
                  styles.lockedStatusPill,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={theme.colors.success}
                />
                <Text
                  style={[
                    styles.lockedStatusText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Locked in for tonight
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <ActionConfirmModal
        visible={confirmDialog.visible}
        action={confirmDialog.action}
        movieTitle={confirmDialog.movie?.title ?? ""}
        syncsRemaining={syncsRemaining}
        onConfirm={handleConfirmDialogAction}
        onCancel={() =>
          setConfirmDialog({ visible: false, action: null, movie: null })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  deckContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomDock: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    minHeight: 48,
    marginBottom: 6,
  },
  lockInPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  returnPill: {
    borderWidth: 1,
    shadowOpacity: 0.15,
  },
  lockInPillText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  lockedStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  lockedStatusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  dockColumn: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  browseOthersLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  browseOthersLinkText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
