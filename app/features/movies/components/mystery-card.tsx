import { useRef, useEffect } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { GridMovie } from "../types/movies.type";

interface MysteryCardProps {
  movie: GridMovie;
  index: number;
  isCenter: boolean;
  isExpanded: boolean;
  animatedStyle: any;
  onPress: () => void;
  onReveal: () => void;
}

export default function MysteryCard({
  movie,
  index,
  isCenter,
  isExpanded,
  animatedStyle,
  onPress,
  onReveal,
}: MysteryCardProps) {
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealScale = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isExpanded) {
      Animated.spring(expandAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();

      Animated.parallel([
        Animated.timing(revealOpacity, {
          toValue: 1,
          duration: 500,
          delay: 300,
          useNativeDriver: false,
        }),
        Animated.spring(revealScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      revealOpacity.setValue(0);
      revealScale.setValue(0.95);
    }
  }, [isExpanded, expandAnim, revealOpacity, revealScale]);

  useEffect(() => {
    if (isCenter && !isExpanded) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCenter, isExpanded, pulseAnim]);

  const cardWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [160, 300],
  });
  const cardHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [224, 420],
  });
  const cardBorderRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 20],
  });
  const numberOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const shadowOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0.95],
  });
  const shadowRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 60],
  });

  const handleReveal = () => {
    onReveal();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        animatedStyle,
        {
          width: cardWidth,
          height: cardHeight,
          borderRadius: cardBorderRadius,
          shadowOpacity,
          shadowRadius,
        },
      ]}
    >
      <Pressable onPress={onPress} style={StyleSheet.absoluteFill}>
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <MaterialCommunityIcons
              name="filmstrip"
              size={18}
              color="#E50914"
              style={{ opacity: 0.8 }}
            />
            <MaterialCommunityIcons
              name="lock-outline"
              size={16}
              color="#666"
            />
          </View>

          <Animated.View
            style={[
              styles.numberContainer,
              { opacity: numberOpacity },
            ]}
          >
            <Text style={styles.number}>{index + 1}</Text>
          </Animated.View>

          {isCenter && !isExpanded ? (
            <Animated.View style={[styles.tapHint, { opacity: pulseAnim }]}>
              <Text style={styles.tapHintText}>Tap to Inspect</Text>
            </Animated.View>
          ) : null}

          <Animated.View
            style={[
              styles.revealContent,
              {
                opacity: revealOpacity,
                transform: [{ scale: revealScale }],
              },
            ]}
            pointerEvents={isExpanded ? "auto" : "none"}
          >
            <Text style={styles.tagline}>
              {movie.tagline || movie.vague_description}
            </Text>

            <Pressable style={styles.revealButton} onPress={handleReveal}>
              <Text style={styles.revealText}>Reveal Movie</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  inner: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  pressable: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  numberContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  number: {
    fontFamily: "Inter_700Bold",
    fontSize: 64,
    color: "#E50914",
    opacity: 0.8,
  },
  tapHint: {
    position: "absolute",
    bottom: 16,
    zIndex: 10,
  },
  tapHintText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 2,
    color: "#E50914",
    textTransform: "uppercase",
  },
  revealContent: {
    ...StyleSheet.absoluteFill,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    backgroundColor: "rgba(28, 28, 28, 0.98)",
    zIndex: 20,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    fontSize: 16,
    color: "white",
    textAlign: "center",
    lineHeight: 24,
  },
  revealButton: {
    backgroundColor: "#E50914",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#E50914",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  revealText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "white",
    textTransform: "uppercase",
  },
});
