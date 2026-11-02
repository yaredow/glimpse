import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tmdbImage } from "../consants/images";
import type { Movie } from "../types/movies.type";

interface MovieHeaderProps {
  movie: Movie;
  onTrailerPress: () => void;
}

const backdropUrl = (path?: string | null) =>
  tmdbImage(path, "w780") ?? undefined;
const posterUrl = (path?: string | null) =>
  tmdbImage(path, "w500") ?? undefined;

export default function MovieHeader({ movie, onTrailerPress }: MovieHeaderProps) {
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  const backdropSrc = backdropUrl(movie.backdrop_path || movie.poster_path);
  const posterSrc = posterUrl(movie.poster_path);

  return (
    <View style={styles.container}>
      {backdropSrc ? (
        <Image
          source={{ uri: backdropSrc }}
          style={styles.backdrop}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
      ) : (
        <View style={[styles.backdrop, styles.backdropFallback]} />
      )}
      <LinearGradient
        colors={["transparent", "rgba(20, 20, 20, 0.65)", "#141414"]}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.details}>
          {movie.genres && movie.genres.length > 0 ? (
            <View style={styles.genreRow}>
              {movie.genres.slice(0, 2).map((genre) => (
                <View key={genre} style={styles.genreBadge}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
          </Text>

          <View style={styles.metaRow}>
            {year ? <Text style={styles.metaText}>{year}</Text> : null}
            {year && movie.director ? (
              <Text style={styles.metaDot}>•</Text>
            ) : null}
            {movie.director ? (
              <Text style={styles.directorText} numberOfLines={1}>
                Dir. {movie.director}
              </Text>
            ) : null}
          </View>

          {movie.trailer_key ? (
            <Pressable
              style={({ pressed }) => [
                styles.trailerButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onTrailerPress}
              accessibilityRole="button"
              accessibilityLabel="Watch trailer"
            >
              <MaterialCommunityIcons name="play" size={14} color="#FFFFFF" />
              <Text style={styles.trailerText}>TRAILER</Text>
            </Pressable>
          ) : null}
        </View>

        {posterSrc ? (
          <Image
            source={{ uri: posterSrc }}
            style={styles.poster}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <MaterialCommunityIcons name="filmstrip" size={32} color="#666" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 350,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 80,
    alignItems: "flex-end",
  },
  details: {
    flex: 1,
    justifyContent: "flex-end",
    marginRight: 14,
  },
  genreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  genreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  genreText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E4E4E7",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 6,
    lineHeight: 29,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    marginBottom: 10,
  },
  metaText: {
    fontSize: 13,
    color: "#D4D4D8",
    fontWeight: "600",
  },
  directorText: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "500",
    flexShrink: 1,
  },
  metaDot: {
    fontSize: 13,
    color: "#71717A",
    marginHorizontal: 6,
  },
  trailerButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(229, 9, 20, 0.9)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  trailerText: {
    fontSize: 11,
    color: "white",
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  poster: {
    width: 96,
    height: 144,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  backdropFallback: {
    backgroundColor: "#1F1F1F",
  },
  posterFallback: {
    backgroundColor: "#262626",
    justifyContent: "center",
    alignItems: "center",
  },
});
