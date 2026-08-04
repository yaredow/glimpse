import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme } from "react-native-paper";
import { MovieCard } from "@/features/movies/components/movie-card";
import { useGetTodaysGrid } from "@/features/movies/hooks/query/use-today-grid";

export default function Watched() {
  const { colors } = useTheme();
  const { data, isPending } = useGetTodaysGrid();

  const revealedMovies = data?.grid.filter((m) => m.is_revealed) ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium">Watched History</Text>
      </View>

      {isPending ? (
        <View style={styles.centered}>
          <Text>Loading history...</Text>
        </View>
      ) : revealedMovies.length === 0 ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge">
            You haven&apos;t revealed any movies yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={revealedMovies}
          keyExtractor={(item) => item.movie_id.toString()}
          renderItem={({ item }) => <MovieCard movie={item as any} />}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 8,
  },
  row: {
    gap: 8,
  },
});
