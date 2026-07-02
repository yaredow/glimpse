import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  Text,
} from "react-native-paper";
import { useGetMovie } from "@/features/movies/hooks/query/use-get-movie";

export default function MovieDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const movieId = Number.parseInt(String(id), 10);

  const { data, isPending, isError, error, refetch } = useGetMovie(
    Number.isFinite(movieId) ? movieId : 0,
  );

  const movie = data?.movie;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: movie?.title ?? "Reveal",
        }}
      />

      {isPending ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Preparing the reveal...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text variant="titleMedium">Couldn’t reveal the movie</Text>
          <Text style={styles.muted}>{error?.message}</Text>
          <Button mode="contained" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      ) : !movie ? (
        <View style={styles.center}>
          <Text variant="titleMedium">Movie not found</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.posterPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="filmstrip" size={80} color={colors.onSurfaceVariant} />
            <View style={[styles.revealBadge, { backgroundColor: colors.primary }]}>
              <Text variant="labelLarge" style={{ color: colors.onPrimary }}>REVEALED</Text>
            </View>
          </View>

          <Card mode="elevated" style={styles.card}>
            <Card.Content>
              <Text variant="headlineMedium" style={styles.title}>
                {movie.title}
              </Text>

              <View style={styles.metaRow}>
                {movie.release_date ? (
                  <Text style={styles.metaText}>
                    {new Date(movie.release_date).getFullYear()}
                  </Text>
                ) : null}
                {movie.runtime ? (
                  <Text style={styles.metaText}>{movie.runtime}m</Text>
                ) : null}
              </View>

              {movie.genres && movie.genres.length > 0 ? (
                <View style={styles.genres}>
                  {movie.genres.map((g) => (
                    <Chip key={g} compact>
                      {g}
                    </Chip>
                  ))}
                </View>
              ) : null}

              <Divider style={styles.divider} />

              <Text variant="bodyLarge" style={styles.description}>
                {movie.vague_description}
              </Text>

              {movie.full_synopsis ? (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="titleMedium" style={{ marginBottom: 8 }}>Synopsis</Text>
                  <Text variant="bodyMedium">{movie.full_synopsis}</Text>
                </>
              ) : null}

              <Divider style={styles.divider} />

              <Button 
                mode={movie.is_watched ? "outlined" : "contained"} 
                onPress={() => {/* TODO: Implement watch toggle mutation */}}
                icon={movie.is_watched ? "check" : "eye"}
                style={styles.watchButton}
              >
                {movie.is_watched ? "Watched" : "Mark as Watched"}
              </Button>
            </Card.Content>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  posterPlaceholder: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: -20,
  },
  revealBadge: {
    position: "absolute",
    bottom: 40,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  center: {
    flex: 1,
    height: 400,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  muted: {
    opacity: 0.7,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 24,
    elevation: 4,
  },
  title: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  metaText: {
    opacity: 0.8,
  },
  genres: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  divider: {
    marginVertical: 20,
    opacity: 0.3,
  },
  description: {
    lineHeight: 24,
    fontStyle: "italic",
    opacity: 0.9,
  },
  watchButton: {
    marginTop: 8,
    borderRadius: 12,
  },
});
