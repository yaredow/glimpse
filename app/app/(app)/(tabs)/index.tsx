import { useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useGetTodaysGrid } from "@/features/movies/hooks/query/use-today-grid";
import ExploreHeader from "@/features/movies/components/explore-header";
import CoverflowCarousel from "@/features/movies/components/coverflow-carousel";
import SyncButton from "@/features/movies/components/sync-button";
import SkeletonLoader from "@/features/movies/components/skeleton-loader";

export default function Discover() {
  const { data, isPending } = useGetTodaysGrid();
  const movies = data?.grid ?? [];

  const handleReveal = useCallback((movieId: number) => {
    router.push(`/(app)/movies/${movieId}`);
  }, []);

  const handleSync = useCallback(() => {
    // TODO: sync with backend
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ExploreHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Your Daily Five</Text>
          <Text style={styles.subtitle}>
            Five sealed envelopes. Five unknown stories. Unlock what awaits.
          </Text>
        </View>

        {isPending ? (
          <SkeletonLoader count={5} />
        ) : (
          <>
            <CoverflowCarousel movies={movies} onReveal={handleReveal} />

            <View style={styles.syncArea}>
              <SyncButton onSync={handleSync} />
            </View>
          </>
        )}
      </ScrollView>
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
