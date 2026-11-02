import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useForm } from "@tanstack/react-form";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";
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
  const theme = useAppTheme();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const resetPassword = useResetPassword();
  const [serverError, setServerError] = useState<string>();
  const [updated, setUpdated] = useState(false);

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
        },
      );
    },
  });

  if (updated) {
    return (
      <AuthShell
        title="Password updated."
        subtitle="Your new password is ready."
      >
        <View style={styles.successBody}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderColor: "rgba(16, 185, 129, 0.3)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={32}
              color={theme.colors.success}
            />
          </View>
          <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
            Sign in with your new password to get back to your nightly five.
          </Text>
          <AuthPrimaryButton
            label="Sign in"
            onPress={() => router.replace("/(auth)/login")}
          />
        </View>
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
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            hint="You can paste the code from your email."
            icon="key-outline"
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
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            hint="At least 8 characters"
            icon="lock-outline"
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

      <View style={styles.footer}>
        <AuthTextLink
          label="Back to sign in"
          onPress={() => router.replace("/(auth)/login")}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  successBody: {
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  successText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 4,
  },
  footer: {
    alignItems: "center",
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
});
