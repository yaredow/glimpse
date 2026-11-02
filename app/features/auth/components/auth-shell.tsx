import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import GlimpseLogo from "@/components/ui/glimpse-logo";
import { useAppTheme } from "@/lib/theme";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={["#0A0A0C", "#0B0A09", "#171006"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(450)} style={styles.brand}>
            <GlimpseLogo size="large" style={styles.logo} />
            <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>
              FIVE FILMS. ONE NIGHT. NO SCROLLING.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(80)}
            style={[
              styles.panel,
              {
                backgroundColor: "rgba(18, 18, 20, 0.96)",
                borderColor: theme.colors.glassBorder,
              },
            ]}
          >
            <View style={[styles.accent, { backgroundColor: theme.colors.gold }]} />
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              >
                {subtitle}
              </Text>
            ) : null}

            <View style={styles.body}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>

          <Text style={[styles.footnote, { color: theme.colors.textMuted }]}>
            A quieter way to choose what to watch.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  brand: {
    alignItems: "center",
  },
  logo: {
    alignItems: "center",
  },
  tagline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 2.2,
    marginTop: 10,
    textAlign: "center",
  },
  panel: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    marginTop: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 10,
  },
  accent: {
    width: 34,
    height: 2,
    borderRadius: 1,
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  body: {
    marginTop: 22,
  },
  footer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    gap: 10,
  },
  footnote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
  },
});
