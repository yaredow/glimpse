import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import MysteryCard from "./mystery-card";
import type { GridMovie } from "../types/movies.type";

interface CoverflowCarouselProps {
  movies: GridMovie[];
  onReveal: (movieId: number) => void;
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

  const scrollX = useSharedValue(0);
  const activeIndex = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const overlayOpacity = useSharedValue(0);

  const maxScroll = -(movies.length - 1) * ITEM_W;

  const snapToIndex = useCallback(
    (index: number, velocityX = 0) => {
      const target = Math.max(0, Math.min(index, movies.length - 1));
      const targetPos = -target * ITEM_W;
      scrollX.value = withSpring(targetPos, {
        stiffness: 180,
        damping: 24,
        mass: 0.9,
        velocity: velocityX * 0.1,
      });
      activeIndex.value = target;
      runOnJS(setCurrentIndex)(target);
    },
    [movies.length, scrollX, activeIndex],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-12, 12])
        .enabled(expandedIndex === null)
        .onBegin(() => {
          isDragging.value = true;
        })
        .onUpdate((e) => {
          const raw = e.translationX - activeIndex.value * ITEM_W;
          scrollX.value =
            raw > 0 ? 0 : raw < maxScroll ? maxScroll : raw;
        })
        .onEnd((e) => {
          isDragging.value = false;
          const currentOffset = -activeIndex.value * ITEM_W;
          const offset = currentOffset + e.translationX;
          const threshold = ITEM_W / 3;
          let target = activeIndex.value;

          if (e.translationX < -threshold) {
            target =
              activeIndex.value + 1 > movies.length - 1
                ? movies.length - 1
                : activeIndex.value + 1;
          } else if (e.translationX > threshold) {
            target = activeIndex.value - 1 < 0 ? 0 : activeIndex.value - 1;
          }

          runOnJS(snapToIndex)(target, e.velocityX);
          runOnJS(impactAsync)(ImpactFeedbackStyle.Light);
        }),
    [expandedIndex, maxScroll, movies.length, snapToIndex],
  );

  const handleCloseExpanded = useCallback(() => {
    setExpandedIndex(null);
    overlayOpacity.value = withSpring(0, {
      stiffness: 200,
      damping: 22,
    });
  }, [overlayOpacity]);

  const handleCardPress = useCallback(
    (cardIndex: number) => {
      if (expandedIndex !== null) {
        if (cardIndex === expandedIndex) {
          handleCloseExpanded();
        }
        return;
      }

      if (cardIndex === currentIndex) {
        setExpandedIndex(cardIndex);
        overlayOpacity.value = withSpring(1, {
          stiffness: 200,
          damping: 22,
        });
      } else {
        snapToIndex(cardIndex);
      }
    },
    [
      currentIndex,
      expandedIndex,
      handleCloseExpanded,
      overlayOpacity,
      snapToIndex,
    ],
  );

  const handleReveal = useCallback(
    (movieId: number) => {
      onReveal(movieId);
    },
    [onReveal],
  );

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const containerOffset = (SW - CARD_W) / 2;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.expandOverlay, overlayAnimatedStyle]}
        pointerEvents={expandedIndex !== null ? "auto" : "none"}
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
            expandedIndex !== null && styles.expandedCarouselArea,
          ]}
          collapsable={false}
        >
          <View
            style={[
              styles.track,
              { paddingHorizontal: containerOffset },
            ]}
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
                isExpanded={expandedIndex === i}
                onPress={() => handleCardPress(i)}
                onReveal={() => handleReveal(movie.movie_id)}
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
    const position = scrollX.value + baseLeft;
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
