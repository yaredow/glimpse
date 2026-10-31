import type { ReactNode } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface StepLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
}

export default function StepLayout({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  children,
}: StepLayoutProps) {
  const theme = useTheme();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Top Navigation & Segmented Progress Bar */}
      <View style={styles.topBar}>
        <View style={styles.backButtonContainer}>
          {onBack ? (
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={theme.colors.onBackground}
              />
            </Pressable>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        <View style={styles.segmentsRow}>
          {Array.from({ length: totalSteps }, (_, i) => {
            const isActive = i <= step;
            return (
              <View
                key={i}
                style={[
                  styles.segment,
                  {
                    backgroundColor: isActive
                      ? theme.colors.primary
                      : "#27272A",
                  },
                ]}
              />
            );
          })}
        </View>

        <Text variant="labelSmall" style={styles.stepBadge}>
          {step + 1}/{totalSteps}
        </Text>
      </View>

      {/* Screen Title & Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyMedium" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Animated Screen Content */}
      <Animated.View
        entering={FadeIn.duration(280)}
        exiting={FadeOut.duration(180)}
        style={styles.content}
      >
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 12,
  },
  backButtonContainer: {
    width: 32,
    alignItems: "flex-start",
  },
  backButton: {
    padding: 4,
    borderRadius: 8,
  },
  segmentsRow: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    height: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepBadge: {
    color: "#71717A",
    fontWeight: "700",
    letterSpacing: 1,
    minWidth: 28,
    textAlign: "right",
    fontSize: 12,
  },
  header: {
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#A1A1AA",
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
});
