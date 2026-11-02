import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";
import { tmdbImage } from "../consants/images";
import type { GridMovie } from "../types/movies.type";

interface MysteryCardProps {
  movie: GridMovie;
  index: number;
  total?: number;
  isCenter: boolean;
  currentPickId?: number;
  onReveal: () => void;
  onViewDetails?: () => void;
  onPickTonight?: () => void;
  onSeen?: () => void;
  onSkip?: () => void;
}

export default function MysteryCard({
  movie,
  index,
  total = 5,
  isCenter,
  currentPickId,
  onReveal,
  onViewDetails,
  onPickTonight,
  onSeen,
  onSkip,
}: MysteryCardProps) {
  const theme = useAppTheme();
  const action = movie.action;
  const isPickAction =
    action === "pick_tonight" || action === "watchlist_add";
  const isCurrentPick = movie.movie_id === currentPickId;
  const isLocked = Boolean(movie.is_locked_in) || action === "locked_in";
  const isWatched = action === "watched";
  const isSeen = action === "seen_before";
  const isSkipped = action === "skipped";
  const isResolved =
    isPickAction || isLocked || isWatched || isSeen || isSkipped;
  const isRevealed =
    Boolean(movie.is_revealed) || action === "revealed" || isResolved;

  const [posterFailed, setPosterFailed] = useState(false);
  const posterSrc = tmdbImage(movie.poster_path || movie.backdrop_path, "w500");

  const flipProgress = useSharedValue(isRevealed ? 1 : 0);

  useEffect(() => {
    flipProgress.value = withSpring(isRevealed ? 1 : 0, {
      stiffness: 120,
      damping: 16,
      mass: 0.7,
    });
  }, [flipProgress, isRevealed]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipProgress.value, [0, 1], [0, 180]);
    const opacity = interpolate(
      flipProgress.value,
      [0, 0.48, 0.52, 1],
      [1, 1, 0, 0],
    );
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateValue}deg` }],
      opacity,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipProgress.value, [0, 1], [180, 360]);
    const opacity = interpolate(
      flipProgress.value,
      [0, 0.48, 0.52, 1],
      [0, 0, 1, 1],
    );
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateValue}deg` }],
      opacity,
    };
  });

  const handleCardPress = () => {
    if (!isRevealed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onReveal();
      return;
    }

    if (isSkipped || isWatched || isSeen) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Toast.show({
        type: "info",
        text1: "Reel Locked",
        text2: isSkipped
          ? "This movie was passed for today."
          : isSeen
            ? "You already marked this as seen."
            : "This movie was marked as watched.",
      });
      return;
    }

    onViewDetails?.();
  };

  const handleTogglePick = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPickTonight?.();
  };

  const handleToggleSeen = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSeen?.();
  };

  const handleToggleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip?.();
  };

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  const metaParts: string[] = [];
  if (releaseYear) metaParts.push(String(releaseYear));
  if (movie.genres?.length > 0) metaParts.push(movie.genres[0]);
  if (movie.vote_average > 0) metaParts.push(`★ ${movie.vote_average.toFixed(1)}`);
  const metaLine = metaParts.join("  ·  ");

  return (
    <View
      style={[
        styles.cardOuter,
        isCurrentPick || isLocked
          ? {
              borderColor: theme.colors.gold,
              borderWidth: 1.5,
            }
          : null,
      ]}
    >
      <Animated.View
        style={[styles.face, styles.frontFace, frontAnimatedStyle]}
        pointerEvents={isRevealed ? "none" : "auto"}
      >
        <Pressable onPress={handleCardPress} style={styles.pressableFace}>
          <LinearGradient
            colors={["#1e1e22", "#141416", "#0e0e10"]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.mysteryHeader}>
            <Text style={styles.reelIndexText}>
              REEL {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </Text>
            <View style={styles.mysteryIconBadge}>
              <MaterialCommunityIcons
                name={isLocked ? "lock" : "lock-outline"}
                size={14}
                color={isLocked ? theme.colors.textMuted : theme.colors.primary}
              />
            </View>
          </View>

          <View style={styles.mysteryBody}>
            <Text style={styles.mysteryTagline} numberOfLines={4}>
              {movie.tagline || "A captivating mystery lies within this reel."}
            </Text>

            {movie.genres?.length > 0 ? (
              <View style={styles.genreRow}>
                {movie.genres.slice(0, 2).map((genre) => (
                  <View key={genre} style={styles.genreChip}>
                    <Text style={styles.genreChipText}>{genre}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.mysteryFooter}>
            {isLocked || isCurrentPick ? (
              <View style={styles.unveilPrompt}>
                <MaterialCommunityIcons
                  name={isLocked ? "lock" : "star"}
                  size={14}
                  color={theme.colors.gold}
                />
                <Text style={[styles.unveilText, { color: theme.colors.gold }]}>
                  {isLocked ? "Locked · Tonight's feature" : "Picked for tonight"}
                </Text>
              </View>
            ) : (
              <View style={styles.unveilPrompt}>
                <MaterialCommunityIcons
                  name="eye-outline"
                  size={15}
                  color={theme.colors.primary}
                />
                <Text style={[styles.unveilText, { color: theme.colors.textPrimary }]}>
                  Tap to unveil
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[styles.face, styles.backFace, backAnimatedStyle]}
        pointerEvents={isRevealed ? "auto" : "none"}
      >
        <Pressable onPress={handleCardPress} style={styles.pressableFace}>
          {posterSrc && !posterFailed ? (
            <Image
              source={{ uri: posterSrc }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
              cachePolicy="memory-disk"
              onError={() => setPosterFailed(true)}
            />
          ) : (
            <View style={[styles.fallbackPoster, { backgroundColor: "#1c1c1f" }]}>
              <MaterialCommunityIcons
                name="filmstrip"
                size={48}
                color={theme.colors.textMuted}
              />
              <Text style={styles.fallbackTitle}>{movie.title}</Text>
            </View>
          )}

          {isSkipped ? (
            <View style={[StyleSheet.absoluteFill, styles.skippedDimOverlay]} />
          ) : null}

          {isWatched || isSkipped || isSeen ? (
            <View style={styles.cornerRibbonContainer} pointerEvents="none">
              <View style={styles.cornerRibbon}>
                <Text style={styles.cornerRibbonText}>
                  {isWatched ? "WATCHED" : isSeen ? "SEEN" : "PASSED"}
                </Text>
              </View>
            </View>
          ) : null}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.92)"]}
            locations={[0, 0.42, 1]}
            style={styles.scrim}
          >
            <Text style={styles.movieTitle} numberOfLines={2}>
              {movie.title}
            </Text>
            {metaLine.length > 0 ? (
              <Text style={styles.metaLine} numberOfLines={1}>
                {metaLine}
              </Text>
            ) : null}
          </LinearGradient>

          <View style={styles.topActionsRow}>
            {!isResolved ? (
              <>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleSkip();
                  }}
                  style={({ pressed }) => [
                    styles.actionCircleBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityLabel="Pass movie"
                >
                  <MaterialCommunityIcons name="close" size={17} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleSeen();
                  }}
                  style={({ pressed }) => [
                    styles.actionCircleBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityLabel="Mark as seen"
                >
                  <MaterialCommunityIcons name="eye-outline" size={17} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleTogglePick();
                  }}
                  style={({ pressed }) => [
                    styles.actionCircleBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityLabel="Pick for tonight"
                >
                  <MaterialCommunityIcons
                    name="star-outline"
                    size={17}
                    color="#FFFFFF"
                  />
                </Pressable>
              </>
            ) : isPickAction || isLocked ? (
              isLocked ? (
                <View
                  style={[
                    styles.actionCircleBtn,
                    { backgroundColor: theme.colors.gold },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="movie-play"
                    size={18}
                    color="#121212"
                  />
                </View>
              ) : (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleTogglePick();
                  }}
                  style={({ pressed }) => [
                    styles.actionCircleBtn,
                    { backgroundColor: theme.colors.gold },
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityLabel="Pick for tonight"
                >
                  <MaterialCommunityIcons name="star" size={18} color="#121212" />
                </Pressable>
              )
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#161618",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  face: {
    ...StyleSheet.absoluteFill,
    borderRadius: 27,
    overflow: "hidden",
  },
  frontFace: {},
  backFace: {},
  pressableFace: {
    flex: 1,
  },
  mysteryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  reelIndexText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    color: "rgba(255, 255, 255, 0.4)",
  },
  mysteryIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  mysteryBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  mysteryTagline: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  genreRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  genreChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  genreChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.3,
  },
  mysteryFooter: {
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  unveilPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unveilText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  fallbackPoster: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fallbackTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 12,
  },
  scrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 48,
    paddingBottom: 22,
    justifyContent: "flex-end",
  },
  movieTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    lineHeight: 28,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  metaLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 6,
    letterSpacing: 0.2,
  },
  cornerRibbonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 88,
    height: 88,
    overflow: "hidden",
    borderTopLeftRadius: 27,
    zIndex: 25,
  },
  cornerRibbon: {
    position: "absolute",
    top: 18,
    left: -28,
    width: 114,
    height: 22,
    transform: [{ rotate: "-45deg" }],
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  cornerRibbonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: "#121212",
    textAlign: "center",
  },
  skippedDimOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    zIndex: 10,
  },
  topActionsRow: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 30,
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
