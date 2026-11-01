import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View, Dimensions } from "react-native";
import { usePanGesture, GestureDetector } from "react-native-gesture-handler";
import { useFocusEffect } from "expo-router";
import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";
import { scheduleOnRN } from "react-native-worklets";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import MysteryCard from "./mystery-card";
import type { GridMovie } from "../types/movies.type";

interface CoverflowCarouselProps {
  movies: GridMovie[];
  onReveal: (movie: GridMovie) => void;
}

const { width: SW } = Dimensions.get("window");
const CARD_W = SW - 64;
const CARD_H = CARD_W * 1.25;
const SPACING = 14;
const ITEM_W = CARD_W + SPACING;

export default function CoverflowCarousel({
  movies,
  onReveal,
}: CoverflowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [prevFirstId, setPrevFirstId] = useState(movies[0]?.movie_id);

  if (movies[0]?.movie_id !== prevFirstId) {
    setPrevFirstId(movies[0]?.movie_id);
    setExpandedIndex(null);
  }

  // An expanded card must be a locked mystery card. Revealed/actioned cards are never expanded.
  const activeExpandedIndex =
    expandedIndex !== null &&
    movies[expandedIndex] &&
    !movies[expandedIndex].is_revealed &&
    !movies[expandedIndex].action
      ? expandedIndex
      : null;

  const scrollX = useSharedValue(0);
  const activeIndex = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const overlayOpacity = useSharedValue(0);

  const maxScroll = -(movies.length - 1) * ITEM_W;

  const snapToIndex = useCallback(
    (index: number, velocityX = 0) => {
      const target = Math.max(0, Math.min(index, movies.length - 1));
      const targetPos = -target * ITEM_W;
      scrollX.set(
        withSpring(targetPos, {
          stiffness: 180,
          damping: 24,
          mass: 0.9,
          velocity: velocityX * 0.1,
        }),
      );
      activeIndex.set(target);
      scheduleOnRN(setCurrentIndex, target);
    },
    [movies.length, scrollX, activeIndex],
  );

  const firstMovieId = movies[0]?.movie_id;
  useEffect(() => {
    snapToIndex(0);
  }, [firstMovieId, snapToIndex]);

  const panGesture = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-12, 12],
    enabled: activeExpandedIndex === null,
    onBegin: () => {
      isDragging.set(true);
    },
    onUpdate: (e) => {
      const raw = e.translationX - activeIndex.get() * ITEM_W;
      scrollX.set(raw > 0 ? 0 : raw < maxScroll ? maxScroll : raw);
    },
    onDeactivate: (e) => {
      isDragging.set(false);
      const threshold = ITEM_W / 3;
      let target = activeIndex.get();

      if (e.translationX < -threshold) {
        target =
          activeIndex.get() + 1 > movies.length - 1
            ? movies.length - 1
            : activeIndex.get() + 1;
      } else if (e.translationX > threshold) {
        target = activeIndex.get() - 1 < 0 ? 0 : activeIndex.get() - 1;
      }

      scheduleOnRN(snapToIndex, target, e.velocityX);
      scheduleOnRN(impactAsync, ImpactFeedbackStyle.Light);
    },
    onFinalize: () => {
      isDragging.set(false);
    },
  });

  const handleCloseExpanded = useCallback(() => {
    setExpandedIndex(null);
    overlayOpacity.set(
      withSpring(0, {
        stiffness: 200,
        damping: 22,
      }),
    );
  }, [overlayOpacity]);

  // When returning to the screen or when grid data changes, ensure no card remains expanded
  useFocusEffect(
    useCallback(() => {
      setExpandedIndex(null);
      overlayOpacity.set(0);
    }, [overlayOpacity]),
  );

  const handleCardPress = useCallback(
    (cardIndex: number) => {
      if (activeExpandedIndex !== null) {
        if (cardIndex === activeExpandedIndex) {
          handleCloseExpanded();
        }
        return;
      }

      if (cardIndex !== currentIndex) {
        snapToIndex(cardIndex);
        return;
      }

      const movie = movies[cardIndex];
      const isRevealed = movie?.is_revealed || !!movie?.action;
      const isSkippedOrWatched =
        movie?.action === "skipped" || movie?.action === "watched";

      if (isSkippedOrWatched) {
        return;
      }

      if (isRevealed) {
        onReveal(movie);
        return;
      }

      setExpandedIndex(cardIndex);
      overlayOpacity.set(
        withSpring(1, {
          stiffness: 200,
          damping: 22,
        }),
      );
    },
    [
      activeExpandedIndex,
      currentIndex,
      handleCloseExpanded,
      movies,
      onReveal,
      overlayOpacity,
      snapToIndex,
    ],
  );

  const handleReveal = useCallback(
    (movie: GridMovie) => {
      setExpandedIndex(null);
      overlayOpacity.set(0);
      onReveal(movie);
    },
    [onReveal, overlayOpacity],
  );

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.get(),
  }));

  const containerOffset = (SW - CARD_W) / 2;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.expandOverlay, overlayAnimatedStyle]}
        pointerEvents={activeExpandedIndex !== null ? "auto" : "none"}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleCloseExpanded}
        />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <View
          style={[
            styles.carouselArea,
            activeExpandedIndex !== null && styles.expandedCarouselArea,
          ]}
          collapsable={false}
        >
          <View
            style={[styles.track, { paddingHorizontal: containerOffset }]}
            collapsable={false}
          >
            {movies.map((movie, i) => (
              <CardSlot
                key={movie.movie_id}
                movie={movie}
                index={i}
                scrollX={scrollX}
                containerOffset={containerOffset}
                isCenter={i === currentIndex}
                isExpanded={activeExpandedIndex === i}
                onPress={() => handleCardPress(i)}
                onReveal={() => handleReveal(movie)}
              />
            ))}
          </View>
        </View>
      </GestureDetector>

      <View style={styles.dots}>
        {movies.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

function CardSlot({
  movie,
  index,
  scrollX,
  containerOffset,
  isCenter,
  isExpanded,
  onPress,
  onReveal,
}: {
  movie: GridMovie;
  index: number;
  scrollX: SharedValue<number>;
  containerOffset: number;
  isCenter: boolean;
  isExpanded: boolean;
  onPress: () => void;
  onReveal: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const baseLeft = index * ITEM_W + containerOffset;
    const position = scrollX.get() + baseLeft;
    const diff = position - containerOffset;
    const absPos = diff < 0 ? -diff : diff;
    const maxDist = ITEM_W;

    const scale = interpolate(
      absPos,
      [0, maxDist * 0.6, maxDist],
      [1, 0.92, 0.85],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      absPos,
      [0, maxDist * 0.5, maxDist],
      [1, 0.7, 0.35],
      Extrapolation.CLAMP,
    );

    const zIndex = absPos < ITEM_W * 0.3 ? 10 : 1;

    return {
      transform: [{ translateX: position }, { scale }],
      opacity,
      zIndex: isExpanded ? 60 : zIndex,
    };
  }, [containerOffset, index, isExpanded]);

  return (
    <Animated.View style={[styles.cardSlot, animatedStyle]}>
      <MysteryCard
        movie={movie}
        index={index}
        isCenter={isCenter}
        isExpanded={isExpanded}
        onPress={onPress}
        onReveal={onReveal}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  carouselArea: {
    width: "100%",
    height: CARD_H,
  },
  expandedCarouselArea: {
    zIndex: 40,
  },
  track: {
    flex: 1,
    flexDirection: "row",
  },
  cardSlot: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CARD_W,
    height: CARD_H,
  },
  expandOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.28)",
    zIndex: 20,
    top: -100,
    bottom: -100,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    backgroundColor: "#E50914",
    width: 20,
    height: 6,
    borderRadius: 3,
  },
});
