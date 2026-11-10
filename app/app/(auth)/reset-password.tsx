import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useForm } from "@tanstack/react-form";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { CheckCircleIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/error";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/features/auth/schemas/auth.schema";
import { firstFieldError } from "@/features/auth/utils/form-error";
import { useResetPassword } from "@/features/auth/hooks/mutations/use-reset-password";
import AuthShell from "@/features/auth/components/auth-shell";
import AuthField from "@/features/auth/components/auth-field";
import {
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthTextLink,
} from "@/features/auth/components/auth-actions";

export default function ResetPassword() {
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const resetPassword = useResetPassword();
  const [serverError, setServerError] = useState<string>();
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (updated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
      const timer = setTimeout(() => {
        router.replace("/(auth)/login");
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [updated]);

  const form = useForm({
    defaultValues: {
      token: tokenParam ?? "",
      password: "",
    } as ResetPasswordFormData,
    validators: {
      onBlur: resetPasswordSchema,
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(undefined);
      resetPassword.mutate(
        { token: value.token, newPassword: value.password },
        {
          onSuccess: () => setUpdated(true),
          onError: async (error) => {
            setServerError(await getErrorMessage(error));
          },
        }
      );
    },
  });

  if (updated) {
    return (
      <AuthShell
        title="Password updated."
        subtitle="Your new password is ready. Redirecting you to sign in..."
      >
        <Animated.View
          entering={FadeIn.duration(400)}
          className="items-center gap-4 w-full"
        >
          <Animated.View
            entering={ZoomIn.duration(450).springify()}
            className="w-20 h-20 rounded-full border border-emerald-500/30 bg-emerald-500/10 items-center justify-center mt-2 mb-2 shadow-lg shadow-emerald-950/40"
          >
            <CheckCircleIcon size={40} color="#10B981" weight="fill" />
          </Animated.View>
          <Text className="text-zinc-400 text-xs leading-5 text-center px-4">
            Sign in with your new password to get back to your nightly five.
          </Text>
          <AuthPrimaryButton
            label="Sign in now"
            onPress={() => router.replace("/(auth)/login")}
          />
        </Animated.View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password."
      subtitle="Use the reset code from your email, then set a new password."
    >
      <form.Field name="token">
        {(field) => (
          <AuthField
            label="Reset code"
            placeholder="Enter reset code"
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            hint="You can paste the code from your email."
            icon="key"
            autoComplete="off"
            textContentType="none"
            returnKeyType="next"
            accessibilityLabel="Password reset code"
          />
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <AuthField
            label="New password"
            placeholder="Enter new password"
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            hint="At least 8 characters"
            icon="lock"
            secure
            autoComplete="new-password"
            textContentType="newPassword"
            passwordRules="minlength: 8;"
            returnKeyType="go"
            onSubmitEditing={() => form.handleSubmit()}
            accessibilityLabel="New password"
          />
        )}
      </form.Field>

      {serverError ? <AuthErrorBanner message={serverError} /> : null}

      <AuthPrimaryButton
        label="Set new password"
        loading={resetPassword.isPending}
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
