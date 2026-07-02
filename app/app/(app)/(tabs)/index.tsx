import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import { DiscoveryCard } from "@/features/movies/components/discovery-card";
import { useGetTodaysGrid } from "@/features/movies/hooks/query/use-today-grid";

export default function Discover() {
  const { colors } = useTheme();
  const { data, isPending } = useGetTodaysGrid();

  const discoveryMovies = data?.grid ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Discover
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Blindly choose your next cinematic journey
          </Text>
        </View>

        {isPending ? (
          <View style={styles.centered}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={styles.discoveryGrid}>
            <View style={styles.row}>
              {discoveryMovies.slice(0, 2).map((movie) => (
                <DiscoveryCard key={movie.movie_id} movie={movie} />
              ))}
            </View>
            <View style={styles.row}>
              {discoveryMovies.slice(2, 4).map((movie) => (
                <DiscoveryCard key={movie.movie_id} movie={movie} />
              ))}
            </View>
            {discoveryMovies[4] && (
              <DiscoveryCard movie={discoveryMovies[4]} isLarge />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 24,
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 120,
  },
  discoveryGrid: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
});
