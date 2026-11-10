import { useMemo } from "react";
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";

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
  const theme = useAppTheme();

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

  const accentColor = dotColor ?? theme.colors.primary;

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.mainRow, { gap: metrics.gap }]}>
        {showMark ? (
          <View
            style={[
              styles.markBadge,
              {
                width: metrics.badgeSize,
                height: metrics.badgeSize,
                borderRadius: metrics.badgeRadius,
                backgroundColor: theme.colors.elevation.level2,
                borderColor: theme.colors.outlineVariant,
              },
              markStyle,
            ]}
          >
            <MaterialCommunityIcons
              name="camera-iris"
              size={metrics.iconSize}
              color={accentColor}
            />
          </View>
        ) : null}

        {showWordmark ? (
          <View style={styles.wordmarkContainer}>
            <View style={styles.textRow}>
              <Text
                style={[
                  styles.brandText,
                  {
                    fontSize: metrics.fontSize,
                    letterSpacing: metrics.letterSpacing,
                    color: theme.colors.textPrimary,
                  },
                  textStyle,
                ]}
              >
                GLIMPSE
              </Text>
              <View
                style={[
                  styles.brandDot,
                  {
                    width: metrics.dotSize,
                    height: metrics.dotSize,
                    borderRadius: metrics.dotSize / 2,
                    marginBottom: metrics.dotMarginBottom,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}
      </View>

      {tagline ? (
        <Text
          style={[
            styles.tagline,
            {
              color: theme.colors.textMuted,
              letterSpacing: Math.round(metrics.letterSpacing * 0.9),
            },
          ]}
        >
          {tagline}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "flex-start",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  markBadge: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmarkContainer: {
    justifyContent: "center",
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  brandText: {
    fontFamily: "Inter_900Black",
    includeFontPadding: false,
  },
  brandDot: {
    alignSelf: "flex-end",
  },
  tagline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 6,
  },
});
