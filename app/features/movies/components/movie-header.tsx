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
  tmdbImage(path, "original") ?? undefined;
const posterUrl = (path?: string | null) =>
  tmdbImage(path, "w500") ?? undefined;

export default function MovieHeader({ movie, onTrailerPress }: MovieHeaderProps) {
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: backdropUrl(movie.backdrop_path) }}
        style={styles.backdrop}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(20, 20, 20, 0.95)"]}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
          </Text>

          {movie.director ? (
            <>
              <Text style={styles.directorLabel}>DIRECTED BY</Text>
              <Text style={styles.directorName}>{movie.director}</Text>
            </>
          ) : null}

          <View style={styles.meta}>
            {year ? <Text style={styles.metaText}>{year}</Text> : null}
            {year && movie.runtime ? (
              <Text style={styles.metaDot}>•</Text>
            ) : null}
            {movie.runtime ? (
              <Text style={styles.metaText}>{movie.runtime} min</Text>
            ) : null}

            {movie.trailer_key ? (
              <Pressable style={styles.trailerButton} onPress={onTrailerPress}>
                <MaterialCommunityIcons name="play" size={14} color="white" />
                <Text style={styles.trailerText}>TRAILER</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {movie.poster_path ? (
          <Image
            source={{ uri: posterUrl(movie.poster_path) }}
            style={styles.poster}
            contentFit="cover"
          />
        ) : null}
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
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    paddingTop: 80,
    alignItems: "flex-end",
  },
  details: {
    flex: 1,
    justifyContent: "flex-end",
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  directorLabel: {
    fontSize: 12,
    color: "#E50914",
    marginBottom: 2,
  },
  directorName: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
    marginBottom: 8,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  metaDot: {
    fontSize: 14,
    color: "white",
    marginHorizontal: 8,
  },
  trailerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    gap: 4,
  },
  trailerText: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "white",
  },
});
