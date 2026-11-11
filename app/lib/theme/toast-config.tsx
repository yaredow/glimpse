import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { themeColors } from "./colors";

interface CinemaToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  accentBorderColor: string;
}

const CinemaToast = ({
  text1,
  text2,
  onPress,
  icon,
  iconColor,
  accentBorderColor,
}: CinemaToastProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { borderLeftColor: accentBorderColor }]}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.contentContainer}>
        {text1 ? (
          <Text style={styles.title} numberOfLines={2}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={styles.message} numberOfLines={3}>
            {text2}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export const toastConfig: ToastConfig = {
  success: ({ text1, text2, onPress }: ToastConfigParams<any>) => (
    <CinemaToast
      text1={text1}
      text2={text2}
      onPress={onPress}
      icon="check-circle"
      iconColor={themeColors.success}
      accentBorderColor={themeColors.success}
    />
  ),
  error: ({ text1, text2, onPress }: ToastConfigParams<any>) => (
    <CinemaToast
      text1={text1}
      text2={text2}
      onPress={onPress}
      icon="alert-circle"
      iconColor={themeColors.primary}
      accentBorderColor={themeColors.primary}
    />
  ),
  info: ({ text1, text2, onPress }: ToastConfigParams<any>) => (
    <CinemaToast
      text1={text1}
      text2={text2}
      onPress={onPress}
      icon="information"
      iconColor={themeColors.primary}
      accentBorderColor={themeColors.primary}
    />
  ),
};

const styles = StyleSheet.create({
  container: {
    width: "92%",
    maxWidth: 420,
    backgroundColor: themeColors.elevation.level3,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
    borderLeftWidth: 4,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    color: themeColors.onSurface,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.1,
  },
  message: {
    color: themeColors.onSurfaceVariant,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});

