import { useCallback, useMemo, useState, type ComponentType } from "react";
import {
  Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowRightIcon,
  ArrowUUpLeftIcon,
  CheckCircleIcon,
  FilmStripIcon,
  PlayCircleIcon,
  WifiSlashIcon,
  type IconProps,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
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
import { colors } from "@/lib/theme/tokens.generated";
import { shadows } from "@/lib/theme/shadows";

const PILL_SHADOW = {
  boxShadow: shadows.raised,
};

interface GridStateCardProps {
  icon: ComponentType<IconProps>;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

function GridStateCard({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: GridStateCardProps) {
  return (
    <View className="w-full max-w-[320px] items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-card px-6 py-8">
      <Icon
        size={42}
        color={colors.primary}
        style={{ marginBottom: 4 }}
      />
      <Text className="text-center text-[15px] font-brandBold text-white">
        {title}
      </Text>
      <Text className="text-center text-[13px] leading-[19px] font-brand text-subtle-foreground">
        {subtitle}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-3 min-h-[44px] justify-center rounded-full border border-white/[0.08] bg-surface-5 px-5 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text className="text-[13px] font-brandSemiBold text-white">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function TodayTab() {
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, refetch } = useGetTodaysGrid();
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

  // Reactive Auto-Advancement: if the active card was resolved elsewhere
  // (e.g. passed/seen from the detail screen), move to the next unresolved one.
  const activeCard = movies[activeIndex];
  if (activeCard && isResolvedAction(activeCard.action)) {
    const nextUnresolved = movies.findIndex(
      (m, idx) => idx >= activeIndex && !isResolvedAction(m.action),
    );
    if (nextUnresolved >= 0) {
      setActiveIndex(nextUnresolved);
    } else {
      const anyUnresolved = movies.findIndex(
        (m) => !isResolvedAction(m.action),
      );
      setActiveIndex(anyUnresolved >= 0 ? anyUnresolved : movies.length);
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
            void recordInteraction.mutateAsync({
              movie_id: other.movie_id,
              action: "revealed",
              grid_session_id: other.grid_session_id,
              grid_position: other.slot_number,
            }).catch(() => {});
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
            void recordInteraction.mutateAsync({
              movie_id: other.movie_id,
              action: "revealed",
              grid_session_id: other.grid_session_id,
              grid_position: other.slot_number,
            }).catch(() => {});
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
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <ShowtimeHub
          movie={tonightPick}
          onLogWatched={handleLogWatched}
          onOpenDetails={(m) => handleViewMovie(m, true)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ExploreHeader
        syncsRemaining={syncsRemaining}
        onSyncPress={handlePromptSync}
        isSyncing={syncMutation.isPending}
        programTheme={programTheme}
      />

      <View
        className="flex-1 justify-between"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 64 }}
      >
        {isPending ? (
          <View className="flex-1 items-center justify-center">
            <SkeletonLoader count={5} />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center">
            <GridStateCard
              icon={WifiSlashIcon}
              title="Couldn&apos;t load tonight&apos;s reel"
              subtitle="We couldn&apos;t reach the cinema. Check your connection and try again."
              actionLabel="Try again"
              onAction={() => {
                refetch();
              }}
            />
          </View>
        ) : movies.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <GridStateCard
              icon={FilmStripIcon}
              title="Tonight&apos;s reel is empty"
              subtitle="No films were drawn for you yet. Pull a fresh batch to start choosing."
              actionLabel="Draw a fresh reel"
              onAction={handlePromptSync}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
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
          <View className="mb-1.5 min-h-[48px] items-center justify-center px-6">
            {tonightPick.action !== "locked_in" ? (
              isViewingTonightPick ? (
                <View className="w-full max-w-[320px] items-center justify-center gap-2">
                  <Pressable
                    onPress={handlePromptLockIn}
                    className="min-h-[44px] w-full max-w-[320px] flex-row items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 active:opacity-85"
                    style={PILL_SHADOW}
                    accessibilityRole="button"
                    accessibilityLabel={`Lock in ${tonightPick.title}`}
                  >
                    <PlayCircleIcon
                      size={17}
                      color={colors.white}
                    />
                    <Text
                      className="text-[12px] tracking-[0.8px] font-brandBold text-white"
                      numberOfLines={1}
                    >
                      LOCK IN &quot;{tonightPick.title.toUpperCase()}&quot;
                    </Text>
                  </Pressable>

                  {tonightPick.is_dealers_choice ? (
                    <Pressable
                      onPress={handleKeepBrowsing}
                      className="flex-row items-center justify-center gap-1.5 px-3 py-1 active:opacity-60"
                      accessibilityRole="button"
                      accessibilityLabel="Browse other movies in this batch"
                      hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
                    >
                      <Text className="text-[13px] tracking-[0.2px] font-brandMedium text-subtle-foreground">
                        Browse other movies
                      </Text>
                      <ArrowRightIcon
                        size={14}
                        color={colors.subtleForeground}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <Pressable
                  onPress={handleReturnToPick}
                  className="min-h-[44px] w-full max-w-[320px] flex-row items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-surface-5 px-5 py-3 active:bg-surface-6 active:opacity-85"
                  style={{ boxShadow: shadows.subtle }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    tonightPick.is_dealers_choice
                      ? "Return to recommendation"
                      : `Return to ${tonightPick.title}`
                  }
                >
                  <ArrowUUpLeftIcon
                    size={17}
                    color={colors.primary}
                  />
                  <Text
                    className="text-[12px] tracking-[0.8px] font-brandBold text-white"
                    numberOfLines={1}
                  >
                    {tonightPick.is_dealers_choice
                      ? "RETURN TO RECOMMENDATION"
                      : `RETURN TO "${tonightPick.title.toUpperCase()}"`}
                  </Text>
                </Pressable>
              )
            ) : (
              <View className="flex-row items-center gap-2 rounded-full border border-white/[0.08] bg-surface-5 px-4 py-2.5">
                <CheckCircleIcon
                  size={16}
                  color={colors.success}
                />
                <Text className="text-[13px] tracking-[0.2px] font-brandSemiBold text-white">
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

