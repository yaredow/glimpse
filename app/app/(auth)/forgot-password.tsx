import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";
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

export default function ForgotPassword() {
  const theme = useAppTheme();
  const requestReset = useRequestPasswordReset();
  const [serverError, setServerError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();

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
        subtitle={`We sent a reset link to ${sentTo} if an account exists.`}
      >
        <View style={styles.successBody}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: theme.colors.cinemaRedMuted,
                borderColor: "rgba(229, 9, 20, 0.3)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="email-outline"
              size={30}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
            Open the link in that email, or use the reset code from the message
            on the next screen.
          </Text>
          <AuthPrimaryButton
            label="Back to sign in"
            onPress={() => router.replace("/(auth)/login")}
          />
          <AuthTextLink
            label="I have a reset code"
            onPress={() => router.push("/(auth)/reset-password")}
          />
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password."
      subtitle="Enter the email on your account and we'll send a reset link."
    >
      <form.Field name="email">
        {(field) => (
          <AuthField
            label="Email"
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            icon="email-outline"
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
