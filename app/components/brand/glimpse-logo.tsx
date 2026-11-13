import { useMemo } from "react";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { Text } from "@/components/ui/text";
import { ApertureIcon } from "phosphor-react-native";
import { colors } from "@/lib/theme/tokens.generated";

interface GlimpseLogoProps {
  size?: "small" | "medium" | "large" | "hero" | number;
  showMark?: boolean;
  showWordmark?: boolean;
  tagline?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  markStyle?: StyleProp<ViewStyle>;
  dotColor?: string;
}

export default function GlimpseLogo({
  size = "medium",
  showMark = true,
  showWordmark = true,
  tagline,
  style,
  textStyle,
  markStyle,
  dotColor,
}: GlimpseLogoProps) {
  const metrics = useMemo(() => {
    if (typeof size === "number") {
      const badgeSize = Math.round(size * 1.35);
      return {
        badgeSize,
        iconSize: Math.round(badgeSize * 0.6),
        badgeRadius: Math.max(4, Math.round(badgeSize * 0.28)),
        fontSize: size,
        dotSize: Math.max(4, Math.round(size * 0.26)),
        letterSpacing: Math.round(size * 0.14),
        dotMarginBottom: Math.round(size * 0.16),
        gap: Math.round(size * 0.35),
      };
    }

    switch (size) {
      case "small":
        return {
          badgeSize: 24,
          iconSize: 14,
          badgeRadius: 6,
          fontSize: 16,
          dotSize: 5,
          letterSpacing: 2,
          dotMarginBottom: 3,
          gap: 6,
        };
      case "large":
        return {
          badgeSize: 52,
          iconSize: 30,
          badgeRadius: 14,
          fontSize: 32,
          dotSize: 8,
          letterSpacing: 4.5,
          dotMarginBottom: 6,
          gap: 12,
        };
      case "hero":
        return {
          badgeSize: 68,
          iconSize: 36,
          badgeRadius: 20,
          fontSize: 28,
          dotSize: 9,
          letterSpacing: 4.8,
          dotMarginBottom: 6,
          gap: 14,
        };
      case "medium":
      default:
        return {
          badgeSize: 28,
          iconSize: 16,
          badgeRadius: 8,
          fontSize: 20,
          dotSize: 6,
          letterSpacing: 2.8,
          dotMarginBottom: 4,
          gap: 8,
        };
    }
  }, [size]);

  const accentColor = dotColor ?? colors.primary;

  return (
    <View className="items-start" style={style}>
      <View className="flex-row items-center" style={{ gap: metrics.gap }}>
        {showMark ? (
          <View
            className="items-center justify-center border border-white/[0.08] bg-surface-5"
            style={[
              {
                width: metrics.badgeSize,
                height: metrics.badgeSize,
                borderRadius: metrics.badgeRadius,
              },
              markStyle,
            ]}
          >
            <ApertureIcon
              size={metrics.iconSize}
              color={accentColor}
              weight="fill"
            />
          </View>
        ) : null}

        {showWordmark ? (
          <View className="justify-center">
            <View className="flex-row items-center gap-1">
              <Text
                className="font-brandExtraBold"
                style={[
                  {
                    fontSize: metrics.fontSize,
                    letterSpacing: metrics.letterSpacing,
                    color: colors.white,
                    includeFontPadding: false,
                  },
                  textStyle,
                ]}
              >
                GLIMPSE
              </Text>
              <View
                className="self-end"
                style={{
                  width: metrics.dotSize,
                  height: metrics.dotSize,
                  borderRadius: metrics.dotSize / 2,
                  marginBottom: metrics.dotMarginBottom,
                  backgroundColor: accentColor,
                }}
              />
            </View>
          </View>
        ) : null}
      </View>

      {tagline ? (
        <Text
          className="mt-1.5 text-center text-[10px] font-brandSemiBold text-faint-foreground uppercase"
          style={{
            color: colors.faintForeground,
            letterSpacing: Math.round(metrics.letterSpacing * 0.9),
          }}
        >
          {tagline}
        </Text>
      ) : null}
    </View>
  );
}

