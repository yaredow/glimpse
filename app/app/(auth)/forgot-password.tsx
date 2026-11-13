import { useEffect, useState } from "react";
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
import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import { EnvelopeSimpleIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/error";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/features/auth/schemas/auth.schema";
import { firstFieldError } from "@/features/auth/utils/form-error";
import { useRequestPasswordReset } from "@/features/auth/hooks/mutations/use-request-password-reset";
import AuthShell from "@/features/auth/components/auth-shell";
import AuthField from "@/features/auth/components/auth-field";
import {
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthTextLink,
} from "@/features/auth/components/auth-actions";
import { colors } from "@/lib/theme/tokens.generated";
import { withAlpha } from "@/lib/theme/color";
import { shadows } from "@/lib/theme/shadows";

export default function ForgotPassword() {
  const requestReset = useRequestPasswordReset();
  const [serverError, setServerError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();

  const pulseAnim = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!sentTo) return;
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
  }, [sentTo, reduceMotion, pulseAnim]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const form = useForm({
    defaultValues: { email: "" } as ForgotPasswordFormData,
    validators: {
      onBlur: forgotPasswordSchema,
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(undefined);
      requestReset.mutate(value.email.trim().toLowerCase(), {
        onSuccess: () => setSentTo(value.email.trim().toLowerCase()),
        onError: async (error) => {
          setServerError(await getErrorMessage(error));
        },
      });
    },
  });

  if (sentTo) {
    return (
      <AuthShell
        title="Check your inbox."
        subtitle={
          <Text className="text-subtle-foreground text-sm text-center leading-relaxed">
            We sent a reset link to{"\n"}
            <Text className="text-white font-brandSemiBold">{sentTo}</Text>{" "}
            if an account exists.
          </Text>
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
                boxShadow: shadows.errorGlow,
              },
              animatedPulseStyle,
            ]}
          >
            <EnvelopeSimpleIcon size={32} color={colors.primary} weight="fill" />
          </Animated.View>
          <Text className="text-subtle-foreground text-xs leading-5 text-center px-4">
            Open the link in that email, or use the reset code from the message
            on the next screen.
          </Text>
          <AuthPrimaryButton
            label="I have a reset code"
            onPress={() =>
              router.push({
                pathname: "/(auth)/reset-password",
                params: sentTo ? { email: sentTo } : undefined,
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

  return (
    <AuthShell
      title="Reset your password."
      subtitle="Enter the email on your account and we'll send a reset link."
      onBack={() => router.replace("/(auth)/login")}
    >
      <form.Field name="email">
        {(field) => (
          <AuthField
            label="Email"
            placeholder="Enter your email"
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            icon="email"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="go"
            onSubmitEditing={() => form.handleSubmit()}
            accessibilityLabel="Email address"
          />
        )}
      </form.Field>

      {serverError ? <AuthErrorBanner message={serverError} /> : null}

      <AuthPrimaryButton
        label="Send reset link"
        loading={requestReset.isPending}
        onPress={() => form.handleSubmit()}
      />

      <View className="items-center mt-6">
        <AuthTextLink
          label="Back to sign in"
          onPress={() => router.replace("/(auth)/login")}
        />
      </View>
    </AuthShell>
  );
}

