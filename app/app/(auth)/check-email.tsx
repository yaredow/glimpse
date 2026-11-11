import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
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
            <Text className="text-white font-brandSemiBold">{email}</Text>
          </Text>
        ) : (
          "We sent you an activation link."
        )
      }
    >
      <View className="items-center gap-4 w-full">
        <Animated.View style={[styles.pulseCircle, animatedPulseStyle]}>
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
          onPress={() =>
            router.replace({
              pathname: "/(auth)/login",
              params: email ? { email } : undefined,
            })
          }
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  pulseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(229, 9, 20, 0.3)",
    backgroundColor: "rgba(229, 9, 20, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 8,
    shadowColor: "#450A0A",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
