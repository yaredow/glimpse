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
  const isRevealed = Boolean(movie.is_revealed) || Boolean(movie.action);
  const action = movie.action;
  const isActioned =
    action === "watched" ||
    action === "skipped" ||
    action === "watchlist_add" ||
    action === "pick_tonight" ||
    action === "locked_in";

  const expanded = useSharedValue(0);
  const contentPhase = useSharedValue(0);
  const [posterFailed, setPosterFailed] = useState(false);

  // The Daily Five uses the poster artwork, with backdrop fallback if poster missing.
  const posterSrc = tmdbImage(movie.poster_path || movie.backdrop_path, "w500");

  useEffect(() => {
    if (isRevealed) return;

    if (isExpanded) {
      expanded.set(
        withSpring(1, {
          stiffness: 160,
          damping: 20,
          mass: 0.8,
        }),
      );
      contentPhase.set(withTiming(1, { duration: 350 }));
    } else {
      expanded.set(withTiming(0, { duration: 250 }));
      contentPhase.set(withTiming(0, { duration: 180 }));
    }
  }, [contentPhase, expanded, isExpanded, isRevealed]);

  const veilStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.value, [0, 0.4, 1], [0.25, 0.05, 0]),
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.value, [0, 0.4], [1, 0]),
    transform: [{ translateY: interpolate(expanded.value, [0, 1], [0, -10]) }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentPhase.value,
    transform: [
      { translateY: interpolate(contentPhase.value, [0, 1], [20, 0]) },
    ],
  }));

  const showPoster = Boolean(posterSrc && !posterFailed);
  const isInteractive = action !== "skipped" && action !== "watched";
  const CardContainer = isInteractive ? Pressable : View;

  return (
    <Animated.View
      style={[
        styles.card,
        (action === "watchlist_add" ||
          action === "pick_tonight" ||
          action === "locked_in") &&
          styles.cardPick,
        action === "watched" && styles.cardWatched,
        action === "skipped" && styles.cardSkipped,
      ]}
    >
      <CardContainer
        {...(isInteractive
          ? {
              onPress: isRevealed ? onReveal : onPress,
              style: styles.pressable,
            }
          : { style: styles.pressable })}
      >
        {showPoster && posterSrc ? (
          <Image
            source={{ uri: posterSrc }}
            style={[
              styles.poster,
              action === "skipped" && styles.posterSkipped,
            ]}
            contentFit="cover"
            blurRadius={isRevealed ? 0 : 24}
            transition={300}
            cachePolicy="memory-disk"
            onError={() => setPosterFailed(true)}
          />
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

        {/* Veil: only shown when movie is locked */}
        {!isRevealed ? (
          <Animated.View style={[styles.veil, veilStyle]} pointerEvents="none">
            <LinearGradient
              colors={["rgba(0,0,0,0.08)", "transparent", "rgba(0,0,0,0.28)"]}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : null}

        {/* Top Status Badge */}
        {isRevealed ? (
          <View style={styles.badge} pointerEvents="none">
            {action === "locked_in" ? (
              <View style={[styles.statusChip, styles.pickChip]}>
                <MaterialCommunityIcons
                  name="play-circle"
                  size={13}
                  color="#f59e0b"
                />
                <Text style={styles.pickLabel}>NOW WATCHING</Text>
              </View>
            ) : action === "pick_tonight" || action === "watchlist_add" ? (
              <View style={[styles.statusChip, styles.pickChip]}>
                <MaterialCommunityIcons name="star" size={13} color="#f59e0b" />
                <Text style={styles.pickLabel}>TONIGHT&apos;S PICK</Text>
              </View>
            ) : action === "watched" ? (
              <View style={[styles.statusChip, styles.watchedChip]}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={13}
                  color="#22c55e"
                />
                <Text style={styles.watchedLabel}>WATCHED</Text>
              </View>
            ) : action === "skipped" ? (
              <View style={[styles.statusChip, styles.skippedChip]}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={13}
                  color="#ef4444"
                />
                <Text style={styles.skippedLabel}>SKIPPED</Text>
              </View>
            ) : (
              <View style={[styles.statusChip, styles.unlockedChip]}>
                <MaterialCommunityIcons
                  name="eye-outline"
                  size={13}
                  color="#38bdf8"
                />
                <Text style={styles.unlockedLabel}>UNLOCKED</Text>
              </View>
            )}
          </View>
        ) : (
          <Animated.View style={[styles.badge, badgeStyle]} pointerEvents="none">
            <View style={styles.lockChip}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={13}
                color="#E50914"
              />
              <Text style={styles.lockLabel}>{index + 1}</Text>
            </View>
          </Animated.View>
        )}

        {/* Bottom Details Drawer */}
        {isRevealed ? (
          <View style={styles.revealPanel} pointerEvents="box-none">
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.65)", "rgba(0,0,0,0.95)"]}
              locations={[0, 0.35, 1]}
              style={styles.revealGradient}
              pointerEvents="box-none"
            >
              <View style={styles.revealInner} pointerEvents="box-none">
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {movie.title}
                </Text>
                <View style={styles.metaRow}>
                  {movie.vote_average > 0 ? (
                    <View style={styles.ratingBadge}>
                      <MaterialCommunityIcons
                        name="star"
                        size={12}
                        color="#FFD700"
                      />
                      <Text style={styles.ratingText}>
                        {movie.vote_average.toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                  {movie.release_date ? (
                    <Text style={styles.yearText}>
                      {new Date(movie.release_date).getFullYear()}
                    </Text>
                  ) : null}
                </View>
                {movie.tagline ? (
                  <Text style={styles.tagline} numberOfLines={2}>
                    &ldquo;{movie.tagline}&rdquo;
                  </Text>
                ) : null}

                <View style={styles.genreRow}>
                  {movie.genres.slice(0, 3).map((g) => (
                    <View key={g} style={styles.genreChip}>
                      <Text style={styles.genreText}>{g}</Text>
                    </View>
                  ))}
                </View>

                {action === "skipped" || action === "watched" ? null : (
                  <Pressable
                    style={[
                      styles.revealButton,
                      isActioned && styles.actionedButton,
                    ]}
                    onPress={onReveal}
                  >
                    <MaterialCommunityIcons
                      name={
                        isActioned
                          ? "information-outline"
                          : "arrow-right"
                      }
                      size={14}
                      color="white"
                      style={{ marginRight: 5 }}
                    />
                    <Text style={styles.revealLabel}>
                      {isActioned ? "VIEW DETAILS" : "MAKE DECISION"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </LinearGradient>
          </View>
        ) : (
          <Animated.View
            style={[styles.revealPanel, contentStyle]}
            pointerEvents={isExpanded ? "auto" : "none"}
          >
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.78)"]}
              locations={[0, 0.45, 1]}
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
        )}
      </CardContainer>
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
  cardPick: {
    borderColor: "#f59e0b",
    borderWidth: 2,
  },
  cardWatched: {
    borderColor: "#22c55e",
    borderWidth: 1.5,
  },
  cardSkipped: {
    borderColor: "rgba(255,255,255,0.08)",
    opacity: 0.6,
  },
  pressable: { flex: 1 },
  poster: { ...StyleSheet.absoluteFill },
  posterSkipped: {
    opacity: 0.45,
  },

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

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  yearText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#aaa",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
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

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  watchedChip: {
    backgroundColor: "rgba(0,0,0,0.8)",
    borderColor: "rgba(34,197,94,0.4)",
  },
  watchedLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#22c55e",
    letterSpacing: 0.5,
  },
  skippedChip: {
    backgroundColor: "rgba(0,0,0,0.8)",
    borderColor: "rgba(239,68,68,0.4)",
  },
  skippedLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#ef4444",
    letterSpacing: 0.5,
  },
  pickChip: {
    backgroundColor: "rgba(0,0,0,0.85)",
    borderColor: "rgba(245,158,11,0.5)",
  },
  pickLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#f59e0b",
    letterSpacing: 0.5,
  },
  unlockedChip: {
    backgroundColor: "rgba(0,0,0,0.8)",
    borderColor: "rgba(56,189,248,0.4)",
  },
  unlockedLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#38bdf8",
    letterSpacing: 0.5,
  },
  actionedButton: {
    backgroundColor: "#2a2a2a",
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
