import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Dimensions, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import type { GridMovie } from "../types/movies.type";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

export const DiscoveryCard = ({
  movie,
  isLarge = false,
}: {
  movie: GridMovie;
  isLarge?: boolean;
}) => {
  const { colors } = useTheme();

  return (
    <Card
      style={[styles.card, isLarge ? styles.largeCard : { width: CARD_WIDTH }]}
      onPress={() => router.push(`/(app)/movies/${movie.movie_id}`)}
    >
      <View
        style={[styles.content, { backgroundColor: colors.surfaceVariant }]}
      >
        <MaterialCommunityIcons
          name="movie-outline"
          size={isLarge ? 40 : 28}
          color={colors.onSurfaceVariant}
          style={styles.icon}
        />
        <Text
          variant={isLarge ? "titleMedium" : "bodyMedium"}
          style={styles.description}
          numberOfLines={isLarge ? 4 : 3}
        >
          {movie.tagline ||
            movie.vague_description ||
            "A mysterious journey awaits in this cinematic experience..."}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text variant="labelSmall" style={{ color: colors.onPrimary }}>
            REVEAL
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    borderRadius: 16,
  },
  largeCard: {
    width: width - 32,
    alignSelf: "center",
  },
  content: {
    height: 180,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  description: {
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.9,
    lineHeight: 20,
  },
  badge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
