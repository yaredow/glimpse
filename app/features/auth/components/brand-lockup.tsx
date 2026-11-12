import { View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ApertureIcon } from "phosphor-react-native";
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
          <ApertureIcon size={16} color={colors.primary} weight="fill" />
        </View>
        <Text className="font-brandExtraBold text-[13px] leading-4 tracking-[2.6px] text-white">
          GLIMPSE
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center">
      {/* Animated components do not take className, so the emblem's layout and
          its red glow stay in a style object. */}
      <Animated.View
        entering={stagger ? FadeIn.delay(100).duration(600) : undefined}
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
        <ApertureIcon size={32} color={colors.primary} weight="fill" />
      </Animated.View>

      <Animated.View
        entering={stagger ? FadeInDown.delay(250).duration(500) : undefined}
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <Text className="font-brandExtraBold text-[24px] leading-7 tracking-[5px] text-white">
          GLIMPSE
        </Text>
        <View className="mb-1.5 ml-[3px] h-[7px] w-[7px] rounded-full bg-primary" />
      </Animated.View>

      <Animated.Text
        entering={stagger ? FadeIn.delay(450).duration(400) : undefined}
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
