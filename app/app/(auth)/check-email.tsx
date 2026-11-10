import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { EnvelopeSimpleIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import AuthShell from "@/features/auth/components/auth-shell";
import {
  AuthPrimaryButton,
  AuthTextLink,
} from "@/features/auth/components/auth-actions";

export default function CheckEmail() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      true
    );
  }, [pulseAnim]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <AuthShell
      title="Check your inbox."
      subtitle={
        email ? (
          <Text className="text-zinc-400 text-sm text-center leading-relaxed">
            We sent an activation link to{"\n"}
            <Text className="text-white font-semibold">{email}</Text>
          </Text>
        ) : (
          "We sent you an activation link."
        )
      }
    >
      <View className="items-center gap-4 w-full">
        <Animated.View
          style={animatedPulseStyle}
          className="w-16 h-16 rounded-full border border-primary/30 bg-primary/10 items-center justify-center mt-1 mb-2 shadow-lg shadow-red-950/40"
        >
          <EnvelopeSimpleIcon size={32} color="#E50914" weight="fill" />
        </Animated.View>

        <Text className="text-zinc-400 text-xs leading-5 text-center px-4">
          Open the link on this device to activate your account. If nothing
          arrives, check your spam folder.
        </Text>

        <AuthPrimaryButton
          label="I have an activation code"
          onPress={() =>
            router.push({
              pathname: "/(auth)/activate",
              params: email ? { email } : undefined,
            })
          }
        />
        <AuthTextLink
          label="Back to sign in"
          onPress={() => router.replace("/(auth)/login")}
        />
      </View>
    </AuthShell>
  );
}
