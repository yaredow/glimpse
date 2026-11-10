import { useEffect } from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const CARD_WIDTH = 116;
const CARD_HEIGHT = 172;
const CARD_GAP = 12;
const ITEM_STRIDE = CARD_HEIGHT + CARD_GAP;

// Bundled local movie posters (0 network latency, 0 empty cards, offline-ready)
const COLUMN_1_POSTERS: ImageSource[] = [
  require("@/assets/images/posters/poster-1.jpg"), // Blade Runner 2049
  require("@/assets/images/posters/poster-2.jpg"), // Parasite
  require("@/assets/images/posters/poster-3.jpg"), // Spirited Away
  require("@/assets/images/posters/poster-4.jpg"), // Interstellar
];

const COLUMN_2_POSTERS: ImageSource[] = [
  require("@/assets/images/posters/poster-5.jpg"), // Whiplash
  require("@/assets/images/posters/poster-6.jpg"), // Dune: Part Two
  require("@/assets/images/posters/poster-7.jpg"), // Inception
  require("@/assets/images/posters/poster-8.jpg"), // The Godfather
];

const COLUMN_3_POSTERS: ImageSource[] = [
  require("@/assets/images/posters/poster-9.jpg"), // Oppenheimer
  require("@/assets/images/posters/poster-10.jpg"), // The Dark Knight
  require("@/assets/images/posters/poster-11.jpg"), // Pulp Fiction
  require("@/assets/images/posters/poster-12.jpg"), // Fight Club
];

interface MarqueeColumnProps {
  posters: ImageSource[];
  direction: "up" | "down";
  duration: number;
}

function MarqueeColumn({ posters, direction, duration }: MarqueeColumnProps) {
  // Triplicate posters to guarantee endless smooth coverage during the translation cycle
  const loopPosters = [...posters, ...posters, ...posters];
  const cycleDistance = posters.length * ITEM_STRIDE;
  const translateY = useSharedValue(direction === "up" ? 0 : -cycleDistance);

  useEffect(() => {
    if (direction === "up") {
      translateY.value = withRepeat(
        withTiming(-cycleDistance, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      translateY.value = withRepeat(
        withTiming(0, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [cycleDistance, direction, duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.columnClip}>
      <Animated.View style={[styles.columnList, animatedStyle]}>
        {loopPosters.map((source, index) => (
          <View key={index} style={styles.cardContainer}>
            <Image
              source={source}
              style={styles.cardImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.cardBorder} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

interface TiltedMarqueeHeroProps {
  style?: StyleProp<ViewStyle>;
}

export function TiltedMarqueeHero({ style }: TiltedMarqueeHeroProps) {
  return (
    <View
      style={[styles.container, style]}
      pointerEvents="none"
    >
      {/* Tilted Marquee Columns spanning the full canvas */}
      <View style={styles.tiltedCanvas}>
        <MarqueeColumn
          posters={COLUMN_1_POSTERS}
          direction="up"
          duration={30000}
        />
        <MarqueeColumn
          posters={COLUMN_2_POSTERS}
          direction="down"
          duration={34000}
        />
        <MarqueeColumn
          posters={COLUMN_3_POSTERS}
          direction="up"
          duration={32000}
        />
      </View>

      {/* Top subtle vignette to soften status bar boundary */}
      <LinearGradient
        colors={["rgba(12, 12, 14, 0.65)", "transparent"]}
        locations={[0, 1]}
        style={styles.topVignette}
      />

      {/* Full-screen progressive cinema dissolve:
          Posters stay clear at top, heavily soften from 20%, and reach pitch black before the logo */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(12, 12, 14, 0.10)",
          "rgba(12, 12, 14, 0.48)",
          "rgba(12, 12, 14, 0.85)",
          "rgba(12, 12, 14, 0.98)",
          "#0C0C0E",
          "#0C0C0E",
        ]}
        locations={[0, 0.16, 0.28, 0.38, 0.46, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    backgroundColor: "#0C0C0E",
  },
  tiltedCanvas: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    justifyContent: "center",
    gap: CARD_GAP,
    transform: [{ rotate: "-12deg" }, { scale: 1.35 }],
  },
  columnClip: {
    width: CARD_WIDTH,
  },
  columnList: {
    gap: CARD_GAP,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#18181B",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  topVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});

export default TiltedMarqueeHero;
