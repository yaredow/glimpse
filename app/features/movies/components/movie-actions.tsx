import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Movie } from "../types/movies.type";

interface MovieActionsProps {
  movie: Movie;
  onToggleWatched: () => void;
}

export default function MovieActions({ movie, onToggleWatched }: MovieActionsProps) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: movie.imdb_id
          ? `Check out "${movie.title}" on IMDb: https://www.imdb.com/title/${movie.imdb_id}`
          : movie.title,
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={onToggleWatched}>
        <MaterialCommunityIcons
          name={movie.is_watched ? "check-circle" : "check-circle-outline"}
          size={22}
          color={movie.is_watched ? "#E50914" : "white"}
        />
        <Text style={[styles.label, movie.is_watched && styles.activeLabel]}>
          {movie.is_watched ? "Watched" : "Mark Watched"}
        </Text>
      </Pressable>

      <Pressable style={styles.button} onPress={handleShare}>
        <MaterialCommunityIcons name="share-outline" size={22} color="white" />
        <Text style={styles.label}>Share</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  button: {
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  activeLabel: {
    color: "#E50914",
  },
});
