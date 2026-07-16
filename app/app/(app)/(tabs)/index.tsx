import { useCallback } from "react";
import {
  ActivityIndicator,
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

export default function Discover() {
  const { data, isPending } = useGetTodaysGrid();
  const movies = data?.grid ?? [];

  const handleReveal = useCallback((movieId: number) => {
    router.push(`/(app)/movies/${movieId}`);
  }, []);

  const handleSync = useCallback(() => {
    // TODO: sync with backend
  }, []);

  if (isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      </SafeAreaView>
    );
  }

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
            Five sealed envelopes. Five unknown stories. Break the seal to
            discover what awaits in the dark.
          </Text>
        </View>

        <CoverflowCarousel movies={movies} onReveal={handleReveal} />

        <View style={styles.syncArea}>
          <SyncButton onSync={handleSync} />
        </View>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
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
    paddingTop: 24,
    paddingBottom: 16,
  },
});
