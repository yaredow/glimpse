import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useGetTodaysGrid } from "@/features/movies/hooks/query/use-today-grid";
import { useRecordInteraction } from "@/features/movies/hooks/mutations/use-record-interactions";
import { useSyncGrid } from "@/features/movies/hooks/mutations/use-sync-grid";
import { useProfile } from "@/features/profile/hooks/use-profile";
import type { GridMovie } from "@/features/movies/types/movies.type";
import ExploreHeader from "@/features/movies/components/explore-header";
import CoverflowCarousel from "@/features/movies/components/coverflow-carousel";
import TonightHero from "@/features/movies/components/tonight-hero";
import SyncButton from "@/features/movies/components/sync-button";
import SkeletonLoader from "@/features/movies/components/skeleton-loader";
import ActionConfirmModal, {
  SyncMood,
} from "@/features/movies/components/action-confirm-modal";

export default function Discover() {
  const { data, isPending } = useGetTodaysGrid();
  const { data: profileData } = useProfile();
  const syncsRemaining = profileData?.user.syncs_remaining ?? 3;
  const recordInteraction = useRecordInteraction();
  const syncMutation = useSyncGrid();
  const [isLockingIn, setIsLockingIn] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  const movies = data?.grid ?? [];
  const tonightPick = movies.find(
    (m) =>
      m.action === "pick_tonight" ||
      m.action === "locked_in" ||
      m.action === "watchlist_add",
  );

  const handleReveal = useCallback(
    (movie: GridMovie) => {
      if (!movie.is_revealed && movie.grid_session_id) {
        recordInteraction.mutate({
          movie_id: movie.movie_id,
          action: "revealed",
          grid_session_id: movie.grid_session_id,
          grid_position: movie.slot_number,
        });
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
    [recordInteraction],
  );

  const handleRequestSync = useCallback(() => {
    if (syncsRemaining <= 0 || syncMutation.isPending) {
      Toast.show({
        type: "info",
        text1: "No Syncs Remaining",
        text2: "You have used all 3 syncs for today.",
      });
      return;
    }
    setShowSyncConfirm(true);
  }, [syncsRemaining, syncMutation.isPending]);

  const handleConfirmSync = useCallback(
    (mood?: SyncMood) => {
      setShowSyncConfirm(false);
      syncMutation.mutate(mood, {
        onSuccess: (res) => {
          Toast.show({
            type: "success",
            text1: "Fresh Batch Synced! 🎬",
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
    },
    [syncMutation],
  );

  const handleLockIn = useCallback(() => {
    if (!tonightPick || isLockingIn) return;
    setIsLockingIn(true);
    recordInteraction.mutate(
      {
        movie_id: tonightPick.movie_id,
        action: "locked_in",
        grid_session_id: tonightPick.grid_session_id ?? "",
        grid_position: tonightPick.slot_number,
      },
      {
        onSuccess: () => {
          setIsLockingIn(false);
          Toast.show({
            type: "success",
            text1: "Now Watching! 🍿",
            text2: "Selection locked for today. Enjoy!",
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
  }, [isLockingIn, recordInteraction, tonightPick]);

  const handleViewDetails = useCallback(() => {
    if (!tonightPick) return;
    router.push({
      pathname: "/(app)/movies/[id]",
      params: {
        id: tonightPick.movie_id,
        sessionId: tonightPick.grid_session_id ?? "",
        slot: tonightPick.slot_number,
        action: tonightPick.action ?? "",
      },
    });
  }, [tonightPick]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ExploreHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>
            {tonightPick
              ? tonightPick.action === "locked_in"
                ? "Now Watching"
                : "Today's Pick"
              : "Your Daily Five"}
          </Text>
          <Text style={styles.subtitle}>
            {tonightPick
              ? tonightPick.action === "locked_in"
                ? "Your selection for today is locked in. Enjoy the show!"
                : "You picked this from your Daily Five. Ready to lock it in?"
              : "Five sealed envelopes. Five unknown stories. Unlock what awaits."}
          </Text>
        </View>

        {isPending ? (
          <SkeletonLoader count={5} />
        ) : tonightPick ? (
          <TonightHero
            movie={tonightPick}
            syncsRemaining={syncsRemaining}
            onLockIn={() => setShowLockConfirm(true)}
            onSync={handleRequestSync}
            onViewDetails={handleViewDetails}
            isLockingIn={isLockingIn}
          />
        ) : (
          <>
            <CoverflowCarousel movies={movies} onReveal={handleReveal} />

            <View style={styles.syncArea}>
              <SyncButton
                onSync={handleRequestSync}
                syncsRemaining={syncsRemaining}
                isSyncing={syncMutation.isPending}
              />
            </View>
          </>
        )}
      </ScrollView>

      {tonightPick ? (
        <ActionConfirmModal
          visible={showLockConfirm}
          action="locked_in"
          movieTitle={tonightPick.title}
          syncsRemaining={syncsRemaining}
          onConfirm={() => {
            setShowLockConfirm(false);
            handleLockIn();
          }}
          onCancel={() => setShowLockConfirm(false)}
        />
      ) : null}

      <ActionConfirmModal
        visible={showSyncConfirm}
        action="sync"
        movieTitle=""
        syncsRemaining={syncsRemaining}
        onConfirm={handleConfirmSync}
        onCancel={() => setShowSyncConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    alignItems: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "white",
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  syncArea: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 16,
  },
});
