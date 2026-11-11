import { View, ScrollView } from "react-native";
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
    <View className="flex-1 bg-background">
      <TiltedMarqueeHero />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className="min-h-[200px] flex-1" />

          <View className="w-full max-w-[420px] self-center px-6 pb-3">
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              style={{ alignItems: "center", marginBottom: 6 }}
            >
              <BrandLockup />
            </Animated.View>

            {/* Value Proposition Headline & Copy */}
            <Animated.View
              entering={FadeInDown.delay(220).duration(450)}
              style={{
                alignItems: "center",
                paddingHorizontal: 8,
                marginVertical: 12,
              }}
            >
              <Text className="mb-1.5 text-center text-[23px] leading-[29px] tracking-[-0.4px] font-brandBold text-white">
                Escape the infinite scroll.
              </Text>
              <Text className="max-w-[320px] text-center text-[13.5px] leading-5 text-zinc-400">
                Five handpicked films every night, calibrated precisely to your
                taste.
              </Text>
            </Animated.View>

            {/* Actions: Get Started & Sign In */}
            <Animated.View
              entering={FadeInUp.delay(350).duration(450)}
              style={{ width: "100%", gap: 14, marginTop: 6 }}
            >
              <AuthPrimaryButton
                label="Get Started"
                onPress={() => router.push("/(onboarding)")}
              />

              <View className="flex-row items-center justify-center gap-1.5">
                <Text className="text-[13px] font-brand text-zinc-500">
                  Already have an account?
                </Text>
                <AuthTextLink label="Sign in" href="/(auth)/login" />
              </View>
            </Animated.View>

            {/* Quiet Cinema Brand Mark */}
            <Animated.View
              entering={FadeIn.delay(500).duration(400)}
              style={{
                paddingTop: 18,
                paddingBottom: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-center text-[9.5px] tracking-[1.2px] font-brandMedium text-zinc-600 uppercase">
                A QUIETER WAY TO CHOOSE WHAT TO WATCH.
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
