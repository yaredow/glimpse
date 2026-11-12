import { useEffect } from "react";
import { View, useWindowDimensions } from "react-native";
import { colors } from "@/lib/theme/tokens.generated";
import { withAlpha } from "@/lib/theme/color";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
  useReducedMotion,
} from "react-native-reanimated";

export default function SkeletonLoader({ count }: { count: number }) {
  const { width: SW, height: SH } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const maxAllowedHeight = Math.max(SH - 270, 360);
  const targetWidth = Math.min(Math.round(SW * 0.88), 356);
  const targetHeight = Math.min(Math.round(targetWidth * 1.5), maxAllowedHeight);
  const CARD_W = Math.round(targetHeight / 1.5);
  const CARD_H = targetHeight;

  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      shimmer.value = 1;
      return;
    }
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [shimmer, reduceMotion]);

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
    <View className="items-center pt-2.5" style={{ width: SW }}>
      <View
        className="overflow-hidden rounded-3xl border border-white/[0.06] bg-card"
        style={{ width: CARD_W, height: CARD_H }}
      >
        <View className="absolute inset-0 overflow-hidden">
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: CARD_W * 0.4,
                backgroundColor: withAlpha(colors.white, 0.03),
              },
              shimmerStyle,
            ]}
          />
        </View>
        <View className="absolute inset-0 items-center justify-center pb-5">
          <View className="mb-3 h-11 w-11 rounded-full bg-surface-5" />
          <View className="mb-3 h-12 w-10 rounded bg-surface-5" />
          <View className="h-2.5 w-[100px] rounded bg-surface-5" />
        </View>
      </View>
      <View className="mt-4 flex-row items-center justify-center gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            className={
              i === 0
                ? "h-1 w-5 rounded-full bg-primary/[0.5]"
                : "h-1 w-[5px] rounded-full bg-white/[0.1]"
            }
          />
        ))}
      </View>
    </View>
  );
}
