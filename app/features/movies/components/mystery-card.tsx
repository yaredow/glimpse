import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import { tmdbImage } from "../consants/images";
import type { GridMovie } from "../types/movies.type";
import { curatorNote, structuredClues } from "../utils/deck";

export type CardStamp = "PASSED" | "SEEN" | null;

interface MysteryCardProps {
  movie: GridMovie;
  index: number;
  total?: number;
  isInteractive: boolean;
  stamp?: CardStamp;
  onReveal?: () => void;
  onViewDetails?: () => void;
}

export default function MysteryCard({
  movie,
  index: _index,
  total: _total = 5,
  isInteractive,
  stamp = null,
  onViewDetails,
}: MysteryCardProps) {
  const theme = useAppTheme();
  const [posterFailed, setPosterFailed] = useState(false);
  const posterSrc = tmdbImage(movie.poster_path || movie.backdrop_path, "w780");
  const note = curatorNote(movie);
  const clues = structuredClues(movie);

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  const metaParts: string[] = [];
  if (releaseYear) metaParts.push(String(releaseYear));
  if (movie.genres?.length > 0) metaParts.push(movie.genres[0]);
  if (movie.vote_average > 0) metaParts.push(`★ ${movie.vote_average.toFixed(1)}`);
  const metaLine = metaParts.join("  ·  ");

  const handlePress = () => {
    if (!isInteractive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewDetails?.();
  };

  return (
    <View style={styles.cardOuter}>
      <Pressable
        onPress={handlePress}
        disabled={!isInteractive}
        style={styles.cardContent}
        accessibilityRole="button"
        accessibilityLabel={`${movie.title}. Tap for details.`}
      >
        {/* Full-bleed poster image */}
        {posterSrc && !posterFailed ? (
          <Image
            source={{ uri: posterSrc }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <View style={[styles.fallbackPoster, { backgroundColor: "#18181b" }]}>
            <MaterialCommunityIcons
              name="filmstrip"
              size={56}
              color={theme.colors.textMuted}
            />
            <Text style={styles.fallbackTitle}>{movie.title}</Text>
          </View>
        )}

        {/* Resolved stamp overlay */}
        {stamp ? (
          <View style={styles.skippedDimOverlay} pointerEvents="none" />
        ) : null}

        {stamp ? (
          <View style={styles.cornerRibbonContainer} pointerEvents="none">
            <View style={styles.cornerRibbon}>
              <Text style={styles.cornerRibbonText}>{stamp}</Text>
            </View>
          </View>
        ) : null}

        {/* Gradient Scrim & Info Overlay */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(10, 10, 14, 0.45)",
            "rgba(10, 10, 14, 0.92)",
            "#0a0a0c",
          ]}
          locations={[0, 0.25, 0.65, 1]}
          style={styles.scrim}
        >
          {/* Genre / Vibe tags */}
          {clues.length > 0 ? (
            <View style={styles.cluesRow}>
              {clues.slice(0, 2).map((clue) => (
                <View key={clue} style={styles.clueBadge}>
                  <Text style={styles.clueBadgeText}>{clue}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Film Title */}
          <Text style={styles.movieTitle} numberOfLines={2}>
            {movie.title}
          </Text>

          {/* Metadata */}
          {metaLine.length > 0 ? (
            <Text style={styles.metaLine} numberOfLines={1}>
              {metaLine}
            </Text>
          ) : null}

          {/* Curator Note / Hook */}
          {note ? (
            <Text style={styles.curatorNote} numberOfLines={2}>
              {note}
            </Text>
          ) : null}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#161618",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
  },
  fallbackPoster: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fallbackTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 14,
  },
  scrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "48%",
    paddingHorizontal: 18,
    paddingBottom: 18,
    justifyContent: "flex-end",
  },
  cluesRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  clueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  clueBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  movieTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    lineHeight: 26,
    color: "#FFFFFF",
    letterSpacing: -0.4,
    textShadowColor: "rgba(0, 0, 0, 0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  metaLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.78)",
    marginTop: 4,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  curatorNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    lineHeight: 17,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 6,
    textShadowColor: "rgba(0, 0, 0, 0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cornerRibbonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 88,
    height: 88,
    overflow: "hidden",
    borderTopLeftRadius: 23,
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
  },
  cornerRibbonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: "#121212",
    textAlign: "center",
  },
  skippedDimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    zIndex: 10,
  },
});
