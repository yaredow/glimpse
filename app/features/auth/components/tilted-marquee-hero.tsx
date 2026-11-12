import { useEffect } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useReducedMotion,
  ReduceMotion,
  Easing,
} from "react-native-reanimated";
import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/lib/theme/tokens.generated";
import { withAlpha } from "@/lib/theme/color";

const CARD_HEIGHT = 172;
const CARD_GAP = 12;
const ITEM_STRIDE = CARD_HEIGHT + CARD_GAP;

const ABSOLUTE_FILL = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

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
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = direction === "up" ? 0 : -cycleDistance;
      return;
    }
    if (direction === "up") {
      translateY.value = withRepeat(
        withTiming(-cycleDistance, {
          duration,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        false,
      );
    } else {
      translateY.value = withRepeat(
        withTiming(0, {
          duration,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        false,
      );
    }
  }, [cycleDistance, direction, duration, reduceMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View className="w-[116px]">
      <Animated.View style={[{ gap: CARD_GAP }, animatedStyle]}>
        {loopPosters.map((source, index) => (
          <View
            key={index}
            className="h-[172px] w-[116px] overflow-hidden rounded-lg bg-card"
          >
            <Image
              source={source}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
            <View className="absolute inset-0 rounded-lg border border-white/[0.08]" />
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
      className="absolute inset-0 overflow-hidden bg-background"
      style={style}
      pointerEvents="none"
    >
      {/* Tilted Marquee Columns spanning the full canvas */}
      <View
        className="absolute inset-0 flex-row justify-center gap-3"
        style={{ transform: [{ rotate: "-12deg" }, { scale: 1.35 }] }}
      >
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

      <LinearGradient
        colors={[withAlpha(colors.background, 0.65), "transparent"]}
        locations={[0, 1]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 80,
        }}
      />

      <LinearGradient
        colors={[
          "transparent",
          withAlpha(colors.background, 0.007),
          withAlpha(colors.background, 0.028),
          withAlpha(colors.background, 0.063),
          withAlpha(colors.background, 0.111),
          withAlpha(colors.background, 0.174),
          withAlpha(colors.background, 0.25),
          withAlpha(colors.background, 0.34),
          withAlpha(colors.background, 0.444),
          withAlpha(colors.background, 0.563),
          withAlpha(colors.background, 0.694),
          withAlpha(colors.background, 0.84),
          colors.background,
          colors.background,
        ]}
        locations={[
          0, 0.047, 0.093, 0.14, 0.187, 0.233, 0.28, 0.327, 0.373, 0.42, 0.467,
          0.513, 0.56, 1,
        ]}
        style={ABSOLUTE_FILL}
      />
    </View>
  );
}

export default TiltedMarqueeHero;
