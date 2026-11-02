import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAppTheme } from "@/lib/theme";
import { useGetTodaysGrid } from "@/features/movies/hooks/query/use-today-grid";
import { useRecordInteraction } from "@/features/movies/hooks/mutations/use-record-interactions";
import { useSyncGrid } from "@/features/movies/hooks/mutations/use-sync-grid";
import { useProfile } from "@/features/profile/hooks/use-profile";
import type { GridMovie } from "@/features/movies/types/movies.type";
import ExploreHeader from "@/features/movies/components/explore-header";
import CoverflowCarousel, {
  CoverflowCarouselHandle,
} from "@/features/movies/components/coverflow-carousel";
import SyncButton from "@/features/movies/components/sync-button";
import SkeletonLoader from "@/features/movies/components/skeleton-loader";
import ActionConfirmModal, {
  ConfirmableAction,
  SyncMood,
} from "@/features/movies/components/action-confirm-modal";
import ShowtimeHub from "@/features/movies/components/showtime-hub";

export default function TodayTab() {
  const theme = useAppTheme();
  const carouselRef = useRef<CoverflowCarouselHandle>(null);
  const { data, isPending } = useGetTodaysGrid();
  const { data: profileData } = useProfile();
  const syncsRemaining = profileData?.user.syncs_remaining ?? 3;
  const recordInteraction = useRecordInteraction();
  const syncMutation = useSyncGrid();
  const [isLockingIn, setIsLockingIn] = useState(false);

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

  const tonightPick = movies.find(
    (m) =>
      Boolean(m.is_locked_in) ||
      m.action === "locked_in" ||
      m.action === "pick_tonight" ||
      m.action === "watchlist_add",
  );
  const hasTodayPick = Boolean(tonightPick);
  const isShowtimeMode =
    Boolean(tonightPick?.is_locked_in) || tonightPick?.action === "locked_in";

  const unmarkedRevealedMovie = movies.find((m) => {
    const isRevealed = Boolean(m.is_revealed) || m.action === "revealed";
    const isMarked =
      m.action === "watched" ||
      m.action === "skipped" ||
      m.action === "watchlist_add" ||
      m.action === "pick_tonight" ||
      m.action === "locked_in";
    return isRevealed && !isMarked;
  });

  const handleReveal = useCallback(
    (movie: GridMovie) => {
      if (!movie.grid_session_id) return;

      if (hasTodayPick) {
        Toast.show({
          type: "info",
          text1: "Deck Locked",
          text2: `You already picked "${tonightPick?.title}" for tonight.`,
        });
        return;
      }

      if (unmarkedRevealedMovie && unmarkedRevealedMovie.movie_id !== movie.movie_id) {
        const unactedIndex = movies.findIndex(
          (m) => m.movie_id === unmarkedRevealedMovie.movie_id,
        );
        if (unactedIndex >= 0) {
          carouselRef.current?.scrollToIndex(unactedIndex);
        }
        Toast.show({
          type: "info",
          text1: "Action Required",
          text2: `Complete that opened revealed movie before opening another.`,
        });
        return;
      }

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
    [hasTodayPick, movies, recordInteraction, tonightPick?.title, unmarkedRevealedMovie],
  );

  const handleViewMovie = useCallback(
    (movie: GridMovie, allowWatched = false) => {
      if (!allowWatched && (movie.action === "skipped" || movie.action === "watched")) {
        Toast.show({
          type: "info",
          text1: "Reel Locked",
          text2:
            movie.action === "skipped"
              ? "This movie was skipped and cannot be opened."
              : "This movie was marked as watched and cannot be opened.",
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

  const handlePromptPick = useCallback(
    (movie: GridMovie) => {
      if (hasTodayPick && tonightPick?.movie_id !== movie.movie_id) {
        Toast.show({
          type: "info",
          text1: "Pick Already Chosen",
          text2: `You already selected "${tonightPick?.title}" for tonight.`,
        });
        return;
      }
      setConfirmDialog({ visible: true, action: "pick_tonight", movie });
    },
    [hasTodayPick, tonightPick?.movie_id, tonightPick?.title],
  );

  const handlePromptWatched = useCallback((movie: GridMovie) => {
    setConfirmDialog({ visible: true, action: "watched", movie });
  }, []);

  const handlePromptSkip = useCallback((movie: GridMovie) => {
    setConfirmDialog({ visible: true, action: "skipped", movie });
  }, []);

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

  const handleConfirmDialogAction = useCallback(
    (mood?: SyncMood) => {
      const { action, movie } = confirmDialog;
      setConfirmDialog({ visible: false, action: null, movie: null });

      if (action === "sync") {
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

      if (!movie || !movie.grid_session_id) return;

      if (action === "pick_tonight") {
        recordInteraction.mutate(
          {
            movie_id: movie.movie_id,
            action: "watchlist_add",
            grid_session_id: movie.grid_session_id,
            grid_position: movie.slot_number,
          },
          {
            onSuccess: () => {
              Toast.show({
                type: "success",
                text1: "Tonight's Pick",
                text2: `"${movie.title}" selected as your feature film.`,
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
      } else if (action === "watched") {
        recordInteraction.mutate(
          {
            movie_id: movie.movie_id,
            action: "watched",
            grid_session_id: movie.grid_session_id,
            grid_position: movie.slot_number,
          },
          {
            onSuccess: () => {
              Toast.show({
                type: "success",
                text1: "Marked as Watched",
                text2: `"${movie.title}" logged. Next reel unlocked!`,
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
      } else if (action === "skipped") {
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
                text1: "Reel Skipped",
                text2: `Skipped "${movie.title}". Next reel unlocked!`,
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
      } else if (action === "locked_in") {
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
      }
    },
    [confirmDialog, recordInteraction, syncMutation],
  );

  const unactedIndex = unmarkedRevealedMovie
    ? movies.findIndex((m) => m.movie_id === unmarkedRevealedMovie.movie_id)
    : -1;

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
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={[styles.screenHeading, { color: theme.colors.textPrimary }]}>
            Today&apos;s Reel
          </Text>
          <Text style={[styles.screenSubheading, { color: theme.colors.textSecondary }]}>
            {hasTodayPick
              ? `Tonight's Pick: ${tonightPick?.title}`
              : unactedIndex >= 0
                ? `Complete Reel 0${unactedIndex + 1} to unlock more`
                : "Five films handpicked for your evening"}
          </Text>
        </View>

        {isPending ? (
          <SkeletonLoader count={5} />
        ) : (
          <>
            <CoverflowCarousel
              ref={carouselRef}
              movies={movies}
              hasTodayPick={hasTodayPick}
              onReveal={handleReveal}
              onPickTonight={handlePromptPick}
              onWatched={handlePromptWatched}
              onSkip={handlePromptSkip}
              onViewDetails={handleViewMovie}
            />

            <View style={styles.bottomDock}>
              {tonightPick && tonightPick.action !== "locked_in" ? (
                <Pressable
                  onPress={handlePromptLockIn}
                  style={({ pressed }) => [
                    styles.lockInPill,
                    { backgroundColor: theme.colors.primary },
                    pressed && { opacity: 0.85 },
                  ]}
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
              ) : tonightPick?.action === "locked_in" ? (
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
              ) : (
                <SyncButton
                  onSync={handlePromptSync}
                  syncsRemaining={syncsRemaining}
                  isSyncing={syncMutation.isPending}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerBlock: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 10,
  },
  screenHeading: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.4,
  },
  screenSubheading: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  bottomDock: {
    marginTop: 12,
    alignItems: "center",
    paddingHorizontal: 24,
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
});
