import { StyleSheet, View, Dimensions } from "react-native";
import { Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Movie } from "../types/movies.type";

const { width: windowWidth } = Dimensions.get("window");
const DEFAULT_CARD_WIDTH = (windowWidth - 32) / 3;

export const MovieCard = ({ movie, width }: { movie: Movie; width?: number }) => {
  const cardWidth = width || DEFAULT_CARD_WIDTH;
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  
  return (
    <Card
      style={[styles.card, { width: cardWidth }]}
      onPress={() => router.push(`/(app)/movies/${movie.id}`)}
    >
      <View style={[styles.poster, { height: cardWidth * 1.5 }]}>
        <MaterialCommunityIcons name="filmstrip" size={28} color="#666" />
      </View>
      <View style={styles.info}>
        <Text variant="labelSmall" numberOfLines={1} style={styles.title}>
          {movie.title}
        </Text>
        {year && <Text style={styles.year}>{year}</Text>}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    overflow: "hidden",
    borderRadius: 12,
  },
  poster: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
  info: {
    padding: 6,
  },
  title: {
    fontWeight: "bold",
  },
  year: {
    fontSize: 10,
    color: "#666",
    marginTop: 1,
  },
});
