import { useRef, useEffect, useCallback, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import MysteryCard from "./mystery-card";
import type { GridMovie } from "../types/movies.type";

interface CoverflowCarouselProps {
  movies: GridMovie[];
  onReveal: (movieId: number) => void;
}

interface CardState {
  tx: Animated.Value;
  rotateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
}

const STATES = [
  { x: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 5 },
  { x: 120, rotate: -20, scale: 0.9, opacity: 0.8, zIndex: 4 },
  { x: 200, rotate: -30, scale: 0.8, opacity: 0.5, zIndex: 3 },
  { x: -200, rotate: 30, scale: 0.8, opacity: 0.5, zIndex: 3 },
  { x: -120, rotate: 20, scale: 0.9, opacity: 0.8, zIndex: 4 },
];

const CARD_INTERVAL = 4000;
const ANIM_DURATION = 600;

export default function CoverflowCarousel({
  movies,
  onReveal,
}: CoverflowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const cardStates = useRef<CardState[]>(
    Array.from({ length: 5 }, () => ({
      tx: new Animated.Value(0),
      rotateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    })),
  ).current;

  const animateToIndex = useCallback(
    (targetIndex: number) => {
      const easing = Easing.bezier(0.25, 1, 0.5, 1);

      const animations = cardStates.map((state, i) => {
        const rel = ((i - targetIndex) % 5 + 5) % 5;
        const t = STATES[rel];
        return Animated.parallel([
          Animated.timing(state.tx, {
            toValue: t.x,
            duration: ANIM_DURATION,
            easing,
            useNativeDriver: false,
          }),
          Animated.timing(state.rotateY, {
            toValue: t.rotate,
            duration: ANIM_DURATION,
            easing,
            useNativeDriver: false,
          }),
          Animated.timing(state.scale, {
            toValue: t.scale,
            duration: ANIM_DURATION,
            easing,
            useNativeDriver: false,
          }),
          Animated.timing(state.opacity, {
            toValue: t.opacity,
            duration: ANIM_DURATION,
            easing,
            useNativeDriver: false,
          }),
        ]);
      });

      Animated.parallel(animations).start();
      setCurrentIndex(targetIndex);
    },
    [cardStates],
  );

  useEffect(() => {
    animateToIndex(0);
  }, [animateToIndex]);

  const startAutoRotate = useCallback(() => {
    stopAutoRotate();
    autoRotateRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % 5;
        animateToIndex(next);
        return next;
      });
    }, CARD_INTERVAL);
  }, [animateToIndex]);

  const stopAutoRotate = useCallback(() => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoRotate();
    return () => {
      stopAutoRotate();
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [startAutoRotate, stopAutoRotate]);

  const handleCardPress = useCallback(
    (cardIndex: number) => {
      if (expandedIndex !== null) return;

      if (cardIndex === currentIndex) {
        stopAutoRotate();
        setExpandedIndex(cardIndex);
      } else {
        stopAutoRotate();
        animateToIndex(cardIndex);
        resumeTimeoutRef.current = setTimeout(() => {
          startAutoRotate();
        }, 6000);
      }
    },
    [currentIndex, expandedIndex, stopAutoRotate, animateToIndex, startAutoRotate],
  );

  useEffect(() => {
    if (expandedIndex !== null) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [expandedIndex, overlayOpacity]);

  const handleCloseExpanded = useCallback(() => {
    setExpandedIndex(null);
    startAutoRotate();
  }, [startAutoRotate]);

  const handleReveal = useCallback(
    (movieId: number) => {
      onReveal(movieId);
    },
    [onReveal],
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={expandedIndex !== null ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseExpanded} />
      </Animated.View>

      <View style={styles.carouselArea}>
        {movies.slice(0, 5).map((movie, i) => {
          const isExpanded = expandedIndex === i;
          const isCenter = i === currentIndex;

          const rel = ((i - currentIndex) % 5 + 5) % 5;

          const rotateStr = cardStates[i].rotateY.interpolate({
            inputRange: [-30, 0, 30],
            outputRange: ["-30deg", "0deg", "30deg"],
          });

          const animatedStyle = {
            transform: [
              { perspective: 1200 },
              { translateX: cardStates[i].tx },
              { rotateY: rotateStr },
              { scale: cardStates[i].scale },
            ],
            opacity: cardStates[i].opacity,
            zIndex: isExpanded ? 100 : STATES[rel].zIndex,
          };

          return (
            <View key={movie.movie_id} style={styles.cardWrapper}>
              <MysteryCard
                movie={movie}
                index={i}
                isCenter={isCenter}
                isExpanded={isExpanded}
                animatedStyle={animatedStyle}
                onPress={() => handleCardPress(i)}
                onReveal={() => handleReveal(movie.movie_id)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselArea: {
    width: "100%",
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {
    position: "absolute",
    width: 160,
    height: 224,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 50,
  },
});
