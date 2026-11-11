import { View, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import {
  AuthPrimaryButton,
  AuthTextLink,
} from "@/features/auth/components/auth-actions";
import { TiltedMarqueeHero } from "@/features/auth/components/tilted-marquee-hero";
import BrandLockup from "@/features/auth/components/brand-lockup";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <TiltedMarqueeHero />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.posterWindow} />

          <View style={styles.contentBlock}>
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              style={styles.brandContainer}
            >
              <BrandLockup />
            </Animated.View>

            {/* Value Proposition Headline & Copy */}
            <Animated.View
              entering={FadeInDown.delay(220).duration(450)}
              style={styles.copyContainer}
            >
              <Text style={styles.headline}>Escape the infinite scroll.</Text>
              <Text style={styles.subtitle}>
                Five handpicked films every night, calibrated precisely to your
                taste.
              </Text>
            </Animated.View>

            {/* Actions: Get Started & Sign In */}
            <Animated.View
              entering={FadeInUp.delay(350).duration(450)}
              style={styles.actionContainer}
            >
              <AuthPrimaryButton
                label="Get Started"
                onPress={() => router.push("/(onboarding)")}
              />

              <View style={styles.authRow}>
                <Text style={styles.authPrompt}>Already have an account?</Text>
                <AuthTextLink label="Sign in" href="/(auth)/login" />
              </View>
            </Animated.View>

            {/* Quiet Cinema Brand Mark */}
            <Animated.View
              entering={FadeIn.delay(500).duration(400)}
              style={styles.footnoteRow}
            >
              <Text style={styles.footnoteText}>
                A QUIETER WAY TO CHOOSE WHAT TO WATCH.
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0E",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  posterWindow: {
    minHeight: 200,
    flex: 1,
  },
  contentBlock: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 6,
  },
  copyContainer: {
    alignItems: "center",
    paddingHorizontal: 8,
    marginVertical: 12,
  },
  headline: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.4,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13.5,
    lineHeight: 20,
    color: "#A1A1AA",
    textAlign: "center",
    maxWidth: 320,
  },
  actionContainer: {
    width: "100%",
    gap: 14,
    marginTop: 6,
  },
  authRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  authPrompt: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#71717A",
  },
  footnoteRow: {
    paddingTop: 18,
    paddingBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  footnoteText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: "#52525B",
    textTransform: "uppercase",
    textAlign: "center",
  },
});
