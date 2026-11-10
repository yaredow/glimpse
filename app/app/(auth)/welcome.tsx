import { View, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { ApertureIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import {
  AuthPrimaryButton,
  AuthTextLink,
} from "@/features/auth/components/auth-actions";
import { TiltedMarqueeHero } from "@/features/auth/components/tilted-marquee-hero";

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
              <View style={styles.emblemBadge}>
                <ApertureIcon size={26} color="#E50914" weight="fill" />
              </View>

              <View style={styles.brandRow}>
                <Text style={styles.brandName}>GLIMPSE</Text>
                <View style={styles.brandDot} />
              </View>

              <Text style={styles.brandTagline}>
                FIVE FILMS. ONE NIGHT. NO SCROLLING.
              </Text>
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
                <AuthTextLink
                  label="Sign in"
                  href="/(auth)/login"
                  onPress={() => router.push("/(auth)/login")}
                />
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
  emblemBadge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#16161A",
    borderWidth: 1.5,
    borderColor: "rgba(229, 9, 20, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#E50914",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  brandName: {
    fontFamily: "Inter_900Black",
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 4.5,
    color: "#FFFFFF",
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E50914",
    marginBottom: 5,
    marginLeft: 3,
  },
  brandTagline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9.5,
    letterSpacing: 2.5,
    color: "#8B8B94",
    textTransform: "uppercase",
    marginTop: 5,
    textAlign: "center",
  },
  copyContainer: {
    alignItems: "center",
    paddingHorizontal: 8,
    marginVertical: 12,
  },
  headline: {
    fontFamily: "Inter_700Bold",
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.4,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_500Medium",
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: "#52525B",
    textTransform: "uppercase",
    textAlign: "center",
  },
});
