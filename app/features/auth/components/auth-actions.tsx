import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { palette, useAppTheme } from "@/lib/theme";

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AuthPrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: AuthPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && !isDisabled && { opacity: 0.9 },
        isDisabled && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.obsidian} />
      ) : (
        <Text style={styles.primaryLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

interface AuthTextLinkProps {
  label: string;
  onPress: () => void;
  align?: "center" | "flex-start" | "flex-end";
}

export function AuthTextLink({
  label,
  onPress,
  align = "center",
}: AuthTextLinkProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="link"
      style={({ pressed }) => [
        styles.textLink,
        { alignSelf: align },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.textLinkLabel, { color: theme.colors.gold }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={styles.errorBanner}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={16}
        color={theme.colors.error}
      />
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: palette.offWhite,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryLabel: {
    color: palette.obsidian,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: 0.4,
  },
  textLink: {
    paddingVertical: 4,
  },
  textLinkLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    lineHeight: 18,
  },
});
