import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, IconButton } from "react-native-paper";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { router } from "expo-router";

interface StepLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  children: ReactNode;
}

export default function StepLayout({
  step,
  totalSteps,
  title,
  children,
}: StepLayoutProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i <= step
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={styles.content}
      >
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          {title}
        </Text>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  title: {
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "900",
  },
});
