import { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

const { width: SW } = Dimensions.get("window");
const CARD_W = SW - 64;
const CARD_H = CARD_W * 1.25;

export default function SkeletonLoader({ count }: { count: number }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => {
    const offset = interpolate(
      shimmer.value,
      [0, 1],
      [-CARD_W, CARD_W * 2],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX: offset }] };
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.shimmerClip}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
        <View style={styles.placeholderContent}>
          <View style={styles.circle} />
          <View style={styles.numberBar} />
          <View style={styles.hintBar} />
        </View>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === 0 && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SW,
    alignItems: "center",
    paddingTop: 8,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 14,
    backgroundColor: "#1A1A1A",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  shimmerClip: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: CARD_W * 0.4,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  placeholderContent: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#222",
    marginBottom: 12,
  },
  numberBar: {
    width: 40,
    height: 48,
    borderRadius: 6,
    backgroundColor: "#222",
    marginBottom: 12,
  },
  hintBar: {
    width: 100,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#222",
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
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dotActive: {
    backgroundColor: "rgba(229,9,20,0.3)",
    width: 20,
    height: 6,
    borderRadius: 3,
  },
});
