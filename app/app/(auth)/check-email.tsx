import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useReducedMotion,
  ReduceMotion,
} from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { EnvelopeSimpleIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import AuthShell from "@/features/auth/components/auth-shell";
import {
  AuthPrimaryButton,
  AuthTextLink,
} from "@/features/auth/components/auth-actions";
import { colors } from "@/lib/theme/tokens.generated";
import { withAlpha } from "@/lib/theme/color";

export default function CheckEmail() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const pulseAnim = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      pulseAnim.value = 1;
      return;
    }
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, reduceMotion: ReduceMotion.System }),
        withTiming(1.0, { duration: 900, reduceMotion: ReduceMotion.System })
      ),
      -1,
      true
    );
  }, [reduceMotion, pulseAnim]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <AuthShell
      title="Check your inbox."
      subtitle={
        email ? (
          <Text className="text-subtle-foreground text-sm text-center leading-relaxed">
            We sent an activation link to{"\n"}
            <Text className="text-white font-brandSemiBold">{email}</Text>
          </Text>
        ) : (
          "We sent you an activation link."
        )
      }
    >
      <View className="items-center gap-4 w-full">
        <Animated.View
          style={[
            {
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 1,
              borderColor: withAlpha(colors.primary, 0.3),
              backgroundColor: withAlpha(colors.primary, 0.1),
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
              marginBottom: 8,
              boxShadow: `0px 8px 16.0px ${withAlpha(colors.errorContainer, 0.4)}`,
            },
            animatedPulseStyle,
          ]}
        >
          <EnvelopeSimpleIcon size={32} color={colors.primary} weight="fill" />
        </Animated.View>

        <Text className="text-subtle-foreground text-xs leading-5 text-center px-4">
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

