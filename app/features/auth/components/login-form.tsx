import { useRef, useState, type ComponentRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import { useAppTheme } from "@/lib/theme";
import { getErrorMessage } from "@/lib/error";
import { loginSchema, type LoginFormData } from "../schemas/auth.schema";
import { firstFieldError } from "../utils/form-error";
import { useLogin } from "../hooks/mutations/use-login";
import AuthField from "./auth-field";
import {
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthTextLink,
} from "./auth-actions";

export const LoginForm = () => {
  const theme = useAppTheme();
  const loginMutation = useLogin();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [serverError, setServerError] = useState<string>();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginFormData,
    validators: {
      onBlur: loginSchema,
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(undefined);
      loginMutation.mutate(value, {
        onError: async (error) => {
          setServerError(await getErrorMessage(error));
        },
      });
    },
  });

  return (
    <View>
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
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="Email address"
          />
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <AuthField
            label="Password"
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            icon="lock-outline"
            secure
            inputRef={passwordRef}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => form.handleSubmit()}
            accessibilityLabel="Password"
          />
        )}
      </form.Field>

      <View style={styles.forgotRow}>
        <AuthTextLink
          label="Forgot password?"
          align="flex-end"
          onPress={() => router.push("/(auth)/forgot-password")}
        />
      </View>

      {serverError ? <AuthErrorBanner message={serverError} /> : null}
      {serverError?.toLowerCase().includes("activ") ? (
        <AuthTextLink
          label="Activate your account"
          align="flex-start"
          onPress={() => router.push("/(auth)/activate")}
        />
      ) : null}

      <AuthPrimaryButton
        label="Sign in"
        loading={loginMutation.isPending}
        onPress={() => form.handleSubmit()}
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          New to Glimpse?
        </Text>
        <AuthTextLink
          label="Create an account"
          onPress={() => router.push("/(auth)/register")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  forgotRow: {
    alignItems: "flex-end",
    marginTop: -4,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
