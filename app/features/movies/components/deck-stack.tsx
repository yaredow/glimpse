import { useState, useCallback } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";
import MysteryCard, { CardStamp } from "./mystery-card";
import type { GridMovie } from "../types/movies.type";
import { isResolvedAction } from "../utils/deck";

interface DeckStackProps {
  movies: GridMovie[];
  currentPickId?: number;
  onReveal?: (movie: GridMovie) => void;
  onPickTonight: (movie: GridMovie) => void;
  onSeen: (movie: GridMovie) => void;
  onSkip: (movie: GridMovie) => void;
  onViewDetails: (movie: GridMovie) => void;
  onReshuffle?: () => void;
}

const { width: SW, height: SH } = Dimensions.get("window");

const maxAllowedHeight = Math.max(SH - 270, 360);
const targetWidth = Math.min(Math.round(SW * 0.88), 356);
const targetHeight = Math.min(Math.round(targetWidth * 1.5), maxAllowedHeight);

export const CARD_WIDTH = Math.round(targetHeight / 1.5);
export const CARD_HEIGHT = targetHeight;

export default function DeckStack({
  movies,
  currentPickId,
  onReveal: _onReveal,
  onPickTonight,
  onSeen,
  onSkip,
  onViewDetails,
  onReshuffle,
}: DeckStackProps) {
  const theme = useAppTheme();

  const getInitialIndex = () => {
    if (movies.length === 0) return 0;
    if (currentPickId) {
      const pickIdx = movies.findIndex((m) => m.movie_id === currentPickId);
      if (pickIdx >= 0) return pickIdx;
    }
    const firstUnresolved = movies.findIndex(
      (m) => !isResolvedAction(m.action),
    );
    return firstUnresolved >= 0 ? firstUnresolved : movies.length;
  };

  const [activeIndex, setActiveIndex] = useState(getInitialIndex);
  const [activeStamp, setActiveStamp] = useState<CardStamp>(null);
  const [prevPickId, setPrevPickId] = useState(currentPickId);

  // 1. Sync index during render if currentPickId changes externally
  if (currentPickId !== prevPickId) {
    setPrevPickId(currentPickId);
    if (currentPickId) {
      const pickIdx = movies.findIndex((m) => m.movie_id === currentPickId);
      if (pickIdx >= 0) {
        setActiveIndex(pickIdx);
      }
    }
  }

  // 2. Reactive Auto-Advancement: If the active movie was resolved externally
  // (e.g. passed/seen from detail screen), adjust index during render to the next unresolved card.
  const currentCard = movies[activeIndex];
  if (currentCard && isResolvedAction(currentCard.action)) {
    const nextUnresolved = movies.findIndex(
      (m, idx) => idx >= activeIndex && !isResolvedAction(m.action),
    );
    if (nextUnresolved >= 0) {
      setActiveIndex(nextUnresolved);
    } else {
      const anyUnresolved = movies.findIndex(
        (m) => !isResolvedAction(m.action),
      );
      if (anyUnresolved >= 0) {
        setActiveIndex(anyUnresolved);
      } else {
        setActiveIndex(movies.length);
      }
    }
  }

  const isDeckCompleted =
    movies.length > 0 &&
    (activeIndex >= movies.length ||
      movies.every((m) => isResolvedAction(m.action)));

  const activeMovie = !isDeckCompleted
    ? (movies[activeIndex] as GridMovie | undefined)
    : undefined;
  const isPicked = activeMovie?.movie_id === currentPickId;
  const isCurrentCardResolved = activeMovie
    ? isResolvedAction(activeMovie.action)
    : false;

  // Animation values for top card sliding away
  const translateX = useSharedValue(0);
  const rotateDeg = useSharedValue(0);
  const opacityVal = useSharedValue(1);

  const animateCardExit = useCallback(
    (direction: "left" | "right", onFinish: () => void) => {
      const targetX = direction === "left" ? -SW * 1.15 : SW * 1.15;
      const targetRot = direction === "left" ? -14 : 14;

      translateX.value = withTiming(targetX, { duration: 240 }, () => {
        translateX.value = 0;
        rotateDeg.value = 0;
        opacityVal.value = 1;
      });
      rotateDeg.value = withTiming(targetRot, { duration: 240 });
      opacityVal.value = withTiming(0, { duration: 200 });

      setTimeout(() => {
        onFinish();
      }, 200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handlePass = useCallback(() => {
    if (!activeMovie || isResolvedAction(activeMovie.action)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveStamp("PASSED");

    animateCardExit("left", () => {
      setActiveStamp(null);
      onSkip(activeMovie);
      setActiveIndex((prev) => prev + 1);
    });
  }, [activeMovie, animateCardExit, onSkip]);

  const handleSeen = useCallback(() => {
    if (!activeMovie || isResolvedAction(activeMovie.action)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActiveStamp("SEEN");

    animateCardExit("right", () => {
      setActiveStamp(null);
      onSeen(activeMovie);
      setActiveIndex((prev) => prev + 1);
    });
  }, [activeMovie, animateCardExit, onSeen]);

  const handlePick = useCallback(() => {
    if (!activeMovie) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPickTonight(activeMovie);
  }, [activeMovie, onPickTonight]);

  return (
    <View style={styles.container}>
      {/* Progress Indicator ("2 of 5", R-01) */}
      <View style={styles.metaBar}>
        <View
          style={[
            styles.progressBadge,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text
            style={[styles.progressText, { color: theme.colors.textSecondary }]}
          >
            {isDeckCompleted
              ? "ALL REELS RESOLVED"
              : `REEL ${String(Math.min(activeIndex + 1, movies.length)).padStart(2, "0")} OF ${String(movies.length).padStart(2, "0")}`}
          </Text>
        </View>
      </View>

      {/* Physical 3D Stack Viewport (R-01) */}
      <View style={styles.stackViewport}>
        {isDeckCompleted ? (
          <View
            style={[
              styles.cardSlot,
              styles.reelClosedCard,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="filmstrip-off"
              size={48}
              color={theme.colors.primary}
              style={styles.reelClosedIcon}
            />
            <Text
              style={[
                styles.reelClosedTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Reel Closed for Tonight
            </Text>
            <Text
              style={[
                styles.reelClosedSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {currentPickId
                ? "You've resolved tonight's five. Your feature is ready to lock in below!"
                : "You've resolved tonight's five. Ready to call it a night, or reshuffle for a new vibe?"}
            </Text>
            {onReshuffle && !currentPickId ? (
              <Pressable
                onPress={onReshuffle}
                style={({ pressed }) => [
                  styles.reshuffleBtn,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Reshuffle tonight's reel"
              >
                <MaterialCommunityIcons
                  name="sync"
                  size={16}
                  color={theme.colors.textPrimary}
                />
                <Text
                  style={[
                    styles.reshuffleBtnText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Reshuffle Tonight&apos;s Reel
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          movies.map((movie, index) => {
            const offset = index - activeIndex;

            // Render only the top card and up to two cards directly beneath it
            if (offset < 0 || offset > 2) return null;

            if (offset === 0) {
              // Top face-up interactive card
              return (
                <Animated.View
                  key={movie.movie_id}
                  style={[
                    styles.cardSlot,
                    {
                      zIndex: 10,
                      transform: [
                        { translateX },
                        { rotate: `${rotateDeg.value}deg` },
                      ],
                      opacity: opacityVal,
                    },
                  ]}
                >
                  <MysteryCard
                    movie={movie}
                    index={index}
                    total={movies.length}
                    isInteractive={true}
                    stamp={activeStamp}
                    onViewDetails={() => onViewDetails(movie)}
                  />
                </Animated.View>
              );
            }

            // Background card 1 (peeking behind top card)
            if (offset === 1) {
              return (
                <View
                  key={movie.movie_id}
                  style={[
                    styles.cardSlot,
                    styles.backgroundLayer1,
                    { zIndex: 9 },
                  ]}
                  pointerEvents="none"
                >
                  <MysteryCard
                    movie={movie}
                    index={index}
                    total={movies.length}
                    isInteractive={false}
                  />
                </View>
              );
            }

            // Background card 2 (deepest visible card in physical stack)
            if (offset === 2) {
              return (
                <View
                  key={movie.movie_id}
                  style={[
                    styles.cardSlot,
                    styles.backgroundLayer2,
                    { zIndex: 8 },
                  ]}
                  pointerEvents="none"
                >
                  <MysteryCard
                    movie={movie}
                    index={index}
                    total={movies.length}
                    isInteractive={false}
                  />
                </View>
              );
            }

            return null;
          })
        )}
      </View>

      {/* Decision Actions: 3 buttons active if activeMovie exists and is unresolved */}
      <View style={styles.bottomBar}>
        {activeMovie && !isDeckCompleted && !isCurrentCardResolved ? (
          <View style={styles.actionsRow}>
            {/* Pass */}
            <Pressable
              onPress={handlePass}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.passBtn,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Pass this film for today"
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Pass
              </Text>
            </Pressable>

            {/* Seen */}
            <Pressable
              onPress={handleSeen}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.seenBtn,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Mark film as already seen"
            >
              <MaterialCommunityIcons
                name="eye-outline"
                size={18}
                color={theme.colors.textPrimary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Seen
              </Text>
            </Pressable>

            {/* Pick */}
            <Pressable
              onPress={handlePick}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.pickBtn,
                {
                  backgroundColor: isPicked
                    ? theme.colors.cinemaRedHover
                    : theme.colors.primary,
                },
                pressed && { opacity: 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Pick film for tonight"
            >
              <MaterialCommunityIcons
                name={isPicked ? "check-circle" : "star"}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.pickBtnText}>
                {isPicked ? "Picked" : "Pick"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  metaBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  progressText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10.5,
    letterSpacing: 1.1,
  },
  stackViewport: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 20,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  cardSlot: {
    position: "absolute",
    top: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  reelClosedCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  reelClosedIcon: {
    marginBottom: 16,
  },
  reelClosedTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  reelClosedSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  reshuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  reshuffleBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  backgroundLayer1: {
    transform: [{ scale: 0.94 }, { translateY: 10 }, { rotate: "2deg" }],
    opacity: 0.82,
  },
  backgroundLayer2: {
    transform: [{ scale: 0.88 }, { translateY: 20 }, { rotate: "-1.5deg" }],
    opacity: 0.5,
  },
  bottomBar: {
    width: CARD_WIDTH,
    marginTop: 12,
    alignItems: "center",
    minHeight: 46,
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 46,
  },
  passBtn: {
    borderWidth: 1,
  },
  seenBtn: {
    borderWidth: 1,
  },
  pickBtn: {
    flex: 1.1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  actionBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  pickBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
