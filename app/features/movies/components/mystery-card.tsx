import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { tmdbImage } from "../consants/images";
import type { GridMovie } from "../types/movies.type";

interface MysteryCardProps {
  movie: GridMovie;
  index: number;
  isCenter: boolean;
  isExpanded: boolean;
  onPress: () => void;
  onReveal: () => void;
}

export default function MysteryCard({
  movie,
  index,
  isCenter,
  isExpanded,
  onPress,
  onReveal,
}: MysteryCardProps) {
  const expanded = useSharedValue(0);
  const contentPhase = useSharedValue(0);
  const [posterFailed, setPosterFailed] = useState(false);

  // The Daily Five uses the poster artwork, not the wide backdrop artwork.
  const posterSrc = tmdbImage(movie.poster_path);

  useEffect(() => {
    if (isExpanded) {
      expanded.value = withSpring(1, { stiffness: 160, damping: 20, mass: 0.8 });
      contentPhase.value = withTiming(1, { duration: 350 });
    } else {
      expanded.value = withTiming(0, { duration: 250 });
      contentPhase.value = withTiming(0, { duration: 180 });
    }
  }, [isExpanded]);

  const veilStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.value, [0, 0.4, 1], [0.25, 0.05, 0]),
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.value, [0, 0.4], [1, 0]),
    transform: [{ translateY: interpolate(expanded.value, [0, 1], [0, -10]) }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentPhase.value,
    transform: [{ translateY: interpolate(contentPhase.value, [0, 1], [20, 0]) }],
  }));

  const showPoster = !!(posterSrc && !posterFailed);

  return (
    <Animated.View style={styles.card}>
      <Pressable onPress={onPress} style={styles.pressable}>
        {showPoster ? (
          <>
            <Image
              source={{ uri: posterSrc }}
              style={styles.poster}
              contentFit="cover"
              blurRadius={24}
              transition={300}
              cachePolicy="memory-disk"
              onError={() => setPosterFailed(true)}
            />
          </>
        ) : (
          <View style={styles.placeholder}>
            <LinearGradient
              colors={["#1A1625", "#0D0D0D"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.placeholderTitle} numberOfLines={2}>
              {movie.title}
            </Text>
            {movie.genres.length > 0 ? (
              <Text style={styles.placeholderGenres} numberOfLines={1}>
                {movie.genres.slice(0, 3).join("  \u00B7  ")}
              </Text>
            ) : null}
          </View>
        )}

        <Animated.View style={[styles.veil, veilStyle]} pointerEvents="none">
          <LinearGradient
            colors={["rgba(0,0,0,0.08)", "transparent", "rgba(0,0,0,0.28)"]}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.badge, badgeStyle]} pointerEvents="none">
          <View style={styles.lockChip}>
            <MaterialCommunityIcons name="lock-outline" size={13} color="#E50914" />
            <Text style={styles.lockLabel}>{index + 1}</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.revealPanel, contentStyle]}
          pointerEvents={isExpanded ? "auto" : "none"}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.62)"]}
            locations={[0, 0.58, 1]}
            style={styles.revealGradient}
          >
            <View style={styles.revealInner}>
              <Text style={styles.tagline} numberOfLines={2}>
                {movie.tagline || movie.vague_description}
              </Text>

              <View style={styles.genreRow}>
                {movie.genres.slice(0, 3).map((g) => (
                  <View key={g} style={styles.genreChip}>
                    <Text style={styles.genreText}>{g}</Text>
                  </View>
                ))}
              </View>

              <Pressable style={styles.revealButton} onPress={onReveal}>
                <MaterialCommunityIcons
                  name="eye-outline"
                  size={14}
                  color="white"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.revealLabel}>REVEAL MOVIE</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  pressable: { flex: 1 },
  poster: { ...StyleSheet.absoluteFill },

  placeholder: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  placeholderTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#555",
    textAlign: "center",
  },
  placeholderGenres: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#E50914",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(8,8,8,0.25)",
  },

  badge: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  lockChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(229,9,20,0.3)",
  },
  lockLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#E50914",
  },

  revealPanel: {
    ...StyleSheet.absoluteFill,
  },
  revealGradient: {
    flex: 1,
    justifyContent: "flex-end",
  },
  revealInner: {
    padding: 14,
    paddingBottom: 16,
    gap: 6,
  },

  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#FFD700",
  },

  movieTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "white",
    letterSpacing: -0.4,
  },

  tagline: {
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    fontSize: 12,
    color: "#bbb",
    lineHeight: 16,
  },

  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#999",
    lineHeight: 16,
  },

  genreRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
  },
  genreChip: {
    backgroundColor: "rgba(229,9,20,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(229,9,20,0.2)",
  },
  genreText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#E50914",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  revealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E50914",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  revealLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
    color: "white",
    textTransform: "uppercase",
  },
});
