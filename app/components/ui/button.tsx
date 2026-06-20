import { StyleSheet } from "react-native";
import { Button as PaperButton, useTheme } from "react-native-paper";
import * as Haptics from "expo-haptics";
import type { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<typeof PaperButton> {
  variant?: "primary" | "secondary" | "text" | "outline";
  size?: "small" | "medium" | "large";
  haptic?: "light" | "medium" | "success" | "none";
}

export const Button = ({
  variant = "primary",
  size = "medium",
  haptic = "none",
  style,
  contentStyle,
  labelStyle,
  onPress,
  children,
  ...props
}: ButtonProps) => {
  const { colors } = useTheme();

  const handlePress = (e: any) => {
    if (haptic !== "none") {
      switch (haptic) {
        case "light":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "success":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    }
    onPress?.(e);
  };

  const getMode = () => {
    switch (variant) {
      case "primary":
        return "contained";
      case "secondary":
        return "contained-tonal";
      case "outline":
        return "outlined";
      case "text":
        return "text";
      default:
        return "contained";
    }
  };

  const getHeight = () => {
    switch (size) {
      case "small":
        return 36;
      case "medium":
        return 48;
      case "large":
        return 56;
      default:
        return 48;
    }
  };

  return (
    <PaperButton
      mode={getMode()}
      onPress={handlePress}
      style={[styles.button, style]}
      contentStyle={[
        { height: getHeight(), paddingHorizontal: 12 },
        contentStyle,
      ]}
      labelStyle={[
        styles.label,
        { fontSize: size === "small" ? 14 : 16 },
        labelStyle,
      ]}
      compact={variant === "text"}
      {...props}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 4,
  },
  label: {
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
