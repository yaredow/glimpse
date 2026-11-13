import { View } from "react-native";
import Animated, { FadeIn, FadeInDown, ReduceMotion } from "react-native-reanimated";
import GlimpseMark from "@/components/brand/glimpse-mark";
import { Text } from "@/components/ui/text";
import fontFamilies from "@/lib/theme/fonts.json";
import { colors } from "@/lib/theme/tokens.generated";
import { withAlpha } from "@/lib/theme/color";
import { shadows } from "@/lib/theme/shadows";

interface BrandLockupProps {
  stagger?: boolean;
  variant?: "hero" | "compact";
}

export default function BrandLockup({
  stagger = false,
  variant = "hero",
}: BrandLockupProps) {
  if (variant === "compact") {
    return (
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-md border border-primary/[0.35] bg-primary/[0.18]">
          <GlimpseMark size={17} />
        </View>
        <View className="flex-row items-baseline">
          <Text
            className="font-brandExtraBold text-[13px] leading-4 tracking-[2.6px] text-white"
            style={{ marginRight: -1.5 }}
          >
            GLIMPSE
          </Text>
          <View
            className="h-1 w-1 rounded-full bg-primary"
            style={{ marginBottom: 0.5, marginLeft: 2 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="items-center">
      {/* Animated components do not take className, so the emblem's layout and
          its red glow stay in a style object. */}
      <Animated.View
        entering={stagger ? FadeIn.delay(100).duration(600).reduceMotion(ReduceMotion.System) : undefined}
        style={{
          width: 60,
          height: 60,
          borderRadius: 18,
          backgroundColor: withAlpha(colors.primary, 0.18),
          borderWidth: 1.5,
          borderColor: withAlpha(colors.primary, 0.35),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
          boxShadow: shadows.glow,
        }}
      >
        <GlimpseMark size={38} />
      </Animated.View>

      <Animated.View
        entering={stagger ? FadeInDown.delay(250).duration(500).reduceMotion(ReduceMotion.System) : undefined}
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "center",
        }}
      >
        <Text
          className="font-brandExtraBold text-[24px] leading-7 tracking-[5px] text-white"
          style={{ marginRight: -3 }}
        >
          GLIMPSE
        </Text>
        <View
          className="h-1.5 w-1.5 rounded-full bg-primary"
          style={{ marginBottom: 1, marginLeft: 3 }}
        />
      </Animated.View>

      <Animated.Text
        entering={stagger ? FadeIn.delay(450).duration(400).reduceMotion(ReduceMotion.System) : undefined}
        style={{
          fontFamily: fontFamilies.semiBold,
          fontSize: 10,
          lineHeight: 14,
          letterSpacing: 2.8,
          color: colors.faintForeground,
          textTransform: "uppercase",
          marginTop: 6,
          textAlign: "center",
        }}
      >
        FIVE FILMS. ONE NIGHT. NO SCROLLING.
      </Animated.Text>
    </View>
  );
}
