import { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator, Pressable, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  DiceFiveIcon,
  EyeIcon,
  FilmStripIcon,
  StarIcon,
  XIcon,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";
import MysteryCard, { CardStamp } from "./mystery-card";
import type { GridMovie } from "../types/movies.type";
import { isResolvedAction } from "../utils/deck";
import { colors } from "@/lib/theme/tokens.generated";

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
  const { width: SW, height: SH } = useWindowDimensions();

  const maxAllowedHeight = Math.max(SH - 270, 360);
  const targetWidth = Math.min(Math.round(SW * 0.88), 356);
  const targetHeight = Math.min(Math.round(targetWidth * 1.5), maxAllowedHeight);
  const cardWidth = Math.round(targetHeight / 1.5);
  const cardHeight = targetHeight;

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
        onFinish();
      });
      rotateDeg.value = withTiming(targetRot, { duration: 240 });
      opacityVal.value = withTiming(0, { duration: 200 });
      /* eslint-enable react-hooks/immutability */
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
    <View className="w-full items-center justify-center">
      <View
        className={cn(
          "flex-row items-center justify-between",
          (isDeckCompleted || !onDealersChoice) && "justify-center",
        )}
        style={{ width: cardWidth, marginBottom: 8 }}
      >
        <View className="rounded-[8px] border border-white/[0.08] bg-surface-5 px-3 py-[5px]">
          <Text className="text-[10.5px] tracking-[1.1px] font-brandBold text-zinc-400">
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
              className={cn(
                "flex-row items-center gap-1.5 rounded-[8px] border border-white/[0.08] bg-surface-5 px-2.5 py-[5px] active:bg-surface-6 active:opacity-75",
                (isDealersChoiceLoading || isShuffling) && "opacity-60",
              )}
              accessibilityRole="button"
              accessibilityLabel="Let Glimpse choose tonight's movie"
            >
              {isDealersChoiceLoading || isShuffling ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ width: 14, height: 14 }}
                />
              ) : (
                <DiceFiveIcon
                  size={14}
                  color={colors.primary}
                />
              )}
              <Text className="text-[10.5px] tracking-[0.4px] font-brandSemiBold text-white">
                {isDealersChoiceLoading || isShuffling
                  ? "Shuffling..."
                  : "Dealer's Choice"}
              </Text>
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-1.5 rounded-[8px] border border-white/[0.08] bg-surface-4 px-2.5 py-[5px] opacity-55">
              <DiceFiveIcon
                size={14}
                color={colors.faintForeground}
              />
              <Text className="text-[10.5px] tracking-[0.4px] font-brandSemiBold text-zinc-500">
                Dealer&apos;s Pick Active
              </Text>
            </View>
          )
        ) : null}
      </View>

      <View
        className="relative items-center justify-start"
        style={{ width: cardWidth, height: cardHeight + 20 }}
      >
        {isDeckCompleted ? (
          <View
            className="absolute top-0 items-center justify-center rounded-[24px] border border-white/[0.08] bg-surface-4 p-6"
            style={{
              width: cardWidth,
              height: cardHeight,
              boxShadow: "0px 12px 20.0px rgba(0, 0, 0, 0.5)",
            }}
          >
            <FilmStripIcon
              size={48}
              color={colors.primary}
              style={{ marginBottom: 16 }}
            />
            <Text className="mb-2 text-center text-[20px] font-brandBold text-white">
              {closedContent.title}
            </Text>
            <Text className="px-2.5 text-center text-[14px] leading-5 font-brand text-zinc-400">
              {closedContent.subtitle}
            </Text>
            {onReshuffle && closedContent.canReshuffle && closedContent.buttonText ? (
              <Pressable
                onPress={onReshuffle}
                className="mt-[22px] flex-row items-center gap-2 rounded-[20px] border border-white/[0.08] bg-surface-5 px-[18px] py-3 active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel={closedContent.buttonText}
              >
                <ArrowsClockwiseIcon
                  size={16}
                  color={colors.white}
                />
                <Text className="text-[13px] font-brandSemiBold text-white">
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
                    {
                      position: "absolute",
                      top: 0,
                      width: cardWidth,
                      height: cardHeight,
                    },
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
                    {
                      position: "absolute",
                      top: 0,
                      width: cardWidth,
                      height: cardHeight,
                    },
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
                    {
                      position: "absolute",
                      top: 0,
                      width: cardWidth,
                      height: cardHeight,
                    },
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
        <View
          className="min-h-[46px] items-center justify-center"
          style={{ width: cardWidth, marginTop: 12 }}
        >
          <View className="w-full flex-row items-center gap-2">
            {/* Pass */}
            <Pressable
              onPress={handlePass}
              className="min-h-[46px] flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-5 py-3 active:opacity-75"
              accessibilityRole="button"
              accessibilityLabel="Pass this film for today"
            >
              <XIcon
                size={18}
                color={colors.faintForeground}
              />
              <Text className="text-[13px] font-brandSemiBold text-zinc-400">
                Pass
              </Text>
            </Pressable>

            {/* Seen */}
            <Pressable
              onPress={handleSeen}
              className="min-h-[46px] flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-5 py-3 active:opacity-75"
              accessibilityRole="button"
              accessibilityLabel="Mark film as already seen"
            >
              <EyeIcon
                size={18}
                color={colors.white}
              />
              <Text className="text-[13px] font-brandSemiBold text-white">
                Seen
              </Text>
            </Pressable>

            {/* Pick */}
            <Pressable
              onPress={handlePick}
              className={cn(
                "min-h-[46px] flex-[1.1] flex-row items-center justify-center gap-1.5 rounded-lg py-3 active:opacity-90",
                isPicked ? "bg-primary-hover" : "bg-primary",
              )}
              style={{
                boxShadow: "0px 3px 5.0px rgba(0, 0, 0, 0.3)",
              }}
              accessibilityRole="button"
              accessibilityLabel="Pick film for tonight"
            >
              {isPicked ? (
                <CheckCircleIcon size={18} color={colors.white} />
              ) : (
                <StarIcon size={18} color={colors.white} />
              )}
              <Text className="text-[13px] tracking-[0.4px] font-brandBold text-white">
                {isPicked ? "Picked" : "Pick"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

