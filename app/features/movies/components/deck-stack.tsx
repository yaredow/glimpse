import { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";
import MysteryCard, { CardStamp } from "./mystery-card";
import type { GridMovie } from "../types/movies.type";
import { isResolvedAction } from "../utils/deck";

interface DeckStackProps {
  movies: GridMovie[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  currentPickId?: number;
  syncsRemaining?: number;
  onReveal?: (movie: GridMovie) => void;
  onPickTonight: (movie: GridMovie) => void;
  onSeen: (movie: GridMovie) => void;
  onSkip: (movie: GridMovie) => void;
  onViewDetails: (movie: GridMovie) => void;
  onReshuffle?: () => void;
  onDealersChoice?: () => void;
  isDealersChoiceLoading?: boolean;
  isShuffling?: boolean;
}

interface ReelClosedContent {
  title: string;
  subtitle: string;
  buttonText: string | null;
  canReshuffle: boolean;
}

function getReelClosedContent(
  currentPickId?: number,
  syncsRemaining: number = 3,
): ReelClosedContent {
  if (currentPickId) {
    return {
      title: "Tonight's Feature Set",
      subtitle:
        "You've resolved this reel. Your feature is ready to lock in below!",
      buttonText: null,
      canReshuffle: false,
    };
  }

  if (syncsRemaining >= 3) {
    return {
      title: "Initial Reel Resolved",
      subtitle:
        "None of tonight's first five hit the mark? Draw a fresh batch for a new vibe — you have 3 reshuffles left tonight.",
      buttonText: "Draw Fresh Reel (3 left)",
      canReshuffle: true,
    };
  }

  if (syncsRemaining === 2) {
    return {
      title: "Second Reel Resolved",
      subtitle:
        "Still searching? Reshuffle for a different mood (2 left), or call it a night.",
      buttonText: "Reshuffle Reel (2 left)",
      canReshuffle: true,
    };
  }

  if (syncsRemaining === 1) {
    return {
      title: "Third Reel Resolved",
      subtitle:
        "One final reshuffle remaining for tonight. Ready to draw your last batch?",
      buttonText: "Final Reshuffle (1 left)",
      canReshuffle: true,
    };
  }

  return {
    title: "That's a Wrap for Tonight",
    subtitle:
      "You've explored all your reels for today. No syncs remaining — your daily five will reset at midnight.",
    buttonText: null,
    canReshuffle: false,
  };
}

const { width: SW, height: SH } = Dimensions.get("window");

const maxAllowedHeight = Math.max(SH - 270, 360);
const targetWidth = Math.min(Math.round(SW * 0.88), 356);
const targetHeight = Math.min(Math.round(targetWidth * 1.5), maxAllowedHeight);

export const CARD_WIDTH = Math.round(targetHeight / 1.5);
export const CARD_HEIGHT = targetHeight;

export default function DeckStack({
  movies,
  activeIndex,
  onActiveIndexChange,
  currentPickId,
  syncsRemaining = 3,
  onReveal: _onReveal,
  onPickTonight,
  onSeen,
  onSkip,
  onViewDetails,
  onReshuffle,
  onDealersChoice,
  isDealersChoiceLoading,
  isShuffling = false,
}: DeckStackProps) {
  const theme = useAppTheme();
  const [activeStamp, setActiveStamp] = useState<CardStamp>(null);

  const isDeckCompleted =
    movies.length > 0 &&
    (activeIndex >= movies.length ||
      movies.every((m) => isResolvedAction(m.action)));

  const closedContent = getReelClosedContent(currentPickId, syncsRemaining);
  const isDealersChoiceUsed = movies.some((m) => Boolean(m.is_dealers_choice));

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

  const shuffleShift = useSharedValue(0);

  useEffect(() => {
    if (isShuffling) {
      shuffleShift.value = withSequence(
        withTiming(-1, { duration: 160 }),
        withTiming(1, { duration: 180 }),
        withTiming(-0.6, { duration: 160 }),
        withTiming(0.4, { duration: 140 }),
        withSpring(0, { damping: 14, stiffness: 120 }),
      );
    } else {
      shuffleShift.value = withSpring(0);
    }
  }, [isShuffling, shuffleShift]);

  const topCardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + shuffleShift.value * 48 },
      { rotate: `${rotateDeg.value + shuffleShift.value * 6}deg` },
    ],
    opacity: opacityVal.value,
  }));

  const midCardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.94 },
      { translateY: 10 },
      { translateX: -shuffleShift.value * 38 },
      { rotate: `${2 - shuffleShift.value * 5}deg` },
    ],
    opacity: 0.82,
  }));

  const botCardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.88 },
      { translateY: 20 },
      { translateX: shuffleShift.value * 24 },
      { rotate: `${-1.5 + shuffleShift.value * 4}deg` },
    ],
    opacity: 0.5,
  }));

  const animateCardExit = useCallback(
    (direction: "left" | "right", onFinish: () => void) => {
      const targetX = direction === "left" ? -SW * 1.15 : SW * 1.15;
      const targetRot = direction === "left" ? -14 : 14;

      /* eslint-disable react-hooks/immutability */
      translateX.value = withTiming(targetX, { duration: 240 }, () => {
        translateX.value = 0;
        rotateDeg.value = 0;
        opacityVal.value = 1;
      });
      rotateDeg.value = withTiming(targetRot, { duration: 240 });
      opacityVal.value = withTiming(0, { duration: 200 });
      /* eslint-enable react-hooks/immutability */

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
      onActiveIndexChange(activeIndex + 1);
    });
  }, [activeMovie, animateCardExit, onSkip, onActiveIndexChange, activeIndex]);

  const handleSeen = useCallback(() => {
    if (!activeMovie || isResolvedAction(activeMovie.action)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActiveStamp("SEEN");

    animateCardExit("right", () => {
      setActiveStamp(null);
      onSeen(activeMovie);
      onActiveIndexChange(activeIndex + 1);
    });
  }, [activeMovie, animateCardExit, onSeen, onActiveIndexChange, activeIndex]);

  const handlePick = useCallback(() => {
    if (!activeMovie) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPickTonight(activeMovie);
  }, [activeMovie, onPickTonight]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.metaBar,
          (isDeckCompleted || !onDealersChoice) && styles.metaBarCentered,
        ]}
      >
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

        {!isDeckCompleted && onDealersChoice ? (
          !isDealersChoiceUsed ? (
            <Pressable
              onPress={onDealersChoice}
              disabled={isDealersChoiceLoading || isShuffling}
              style={({ pressed }) => [
                styles.dealersChoiceBadge,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
                pressed && {
                  opacity: 0.75,
                  backgroundColor: theme.colors.elevation.level3,
                },
                (isDealersChoiceLoading || isShuffling) && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Let Glimpse choose tonight's movie"
            >
              {isDealersChoiceLoading || isShuffling ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={styles.spinner}
                />
              ) : (
                <MaterialCommunityIcons
                  name="dice-multiple"
                  size={14}
                  color={theme.colors.primary}
                />
              )}
              <Text
                style={[
                  styles.dealersChoiceText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {isDealersChoiceLoading || isShuffling
                  ? "Shuffling..."
                  : "Dealer's Choice"}
              </Text>
            </Pressable>
          ) : (
            <View
              style={[
                styles.dealersChoiceBadge,
                styles.dealersChoiceUsedBadge,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="dice-multiple"
                size={14}
                color={theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.dealersChoiceText,
                  { color: theme.colors.textMuted },
                ]}
              >
                Dealer&apos;s Pick Active
              </Text>
            </View>
          )
        ) : null}
      </View>

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
              {closedContent.title}
            </Text>
            <Text
              style={[
                styles.reelClosedSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {closedContent.subtitle}
            </Text>
            {onReshuffle && closedContent.canReshuffle && closedContent.buttonText ? (
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
                accessibilityLabel={closedContent.buttonText}
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
                  {closedContent.buttonText}
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
                    { zIndex: 10 },
                    topCardAnimStyle,
                  ]}
                >
                  <MysteryCard
                    movie={movie}
                    index={index}
                    total={movies.length}
                    isInteractive={!isShuffling}
                    stamp={activeStamp}
                    onViewDetails={() => onViewDetails(movie)}
                  />
                </Animated.View>
              );
            }

            // Background card 1 (peeking behind top card)
            if (offset === 1) {
              return (
                <Animated.View
                  key={movie.movie_id}
                  style={[
                    styles.cardSlot,
                    { zIndex: 9 },
                    midCardAnimStyle,
                  ]}
                  pointerEvents="none"
                >
                  <MysteryCard
                    movie={movie}
                    index={index}
                    total={movies.length}
                    isInteractive={false}
                  />
                </Animated.View>
              );
            }

            // Background card 2 (deepest visible card in physical stack)
            if (offset === 2) {
              return (
                <Animated.View
                  key={movie.movie_id}
                  style={[
                    styles.cardSlot,
                    { zIndex: 8 },
                    botCardAnimStyle,
                  ]}
                  pointerEvents="none"
                >
                  <MysteryCard
                    movie={movie}
                    index={index}
                    total={movies.length}
                    isInteractive={false}
                  />
                </Animated.View>
              );
            }

            return null;
          })
        )}
      </View>

      {activeMovie && !isDeckCompleted && !isCurrentCardResolved && !activeMovie.is_dealers_choice ? (
        <View style={styles.bottomBar}>
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
        </View>
      ) : null}
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
    justifyContent: "space-between",
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  metaBarCentered: {
    justifyContent: "center",
  },
  dealersChoiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  dealersChoiceText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10.5,
    letterSpacing: 0.4,
  },
  spinner: {
    width: 14,
    height: 14,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  progressText: {
    fontFamily: "PlusJakartaSans_700Bold",
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
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  reelClosedSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
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
    fontFamily: "PlusJakartaSans_600SemiBold",
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
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
  },
  pickBtnText: {
    color: "#FFFFFF",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  dealersChoiceUsedBadge: {
    opacity: 0.55,
  },
});
