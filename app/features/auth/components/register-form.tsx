import { useRef, useState, type ComponentRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import { useAppTheme } from "@/lib/theme";
import { getErrorMessage } from "@/lib/error";
import { registerSchema, type RegisterFormData } from "../schemas/auth.schema";
import { firstFieldError } from "../utils/form-error";
import { useRegister } from "../hooks/mutations/use-register";
import AuthField from "./auth-field";
import {
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthTextLink,
} from "./auth-actions";

export const RegisterForm = () => {
  const theme = useAppTheme();
  const registerMutation = useRegister();
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [serverError, setServerError] = useState<string>();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    } as RegisterFormData,
    validators: {
      onBlur: registerSchema,
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(undefined);
      registerMutation.mutate(value, {
        onSuccess: () => {
          router.replace({
            pathname: "/(auth)/check-email",
            params: { email: value.email },
          });
        },
        onError: async (error) => {
          setServerError(await getErrorMessage(error));
        },
      });
    },
  });

  return (
    <View>
      <form.Field name="name">
        {(field) => (
          <AuthField
            label="Full name"
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            icon="account-outline"
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            accessibilityLabel="Full name"
          />
        )}
      </form.Field>

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
            inputRef={emailRef}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
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
            hint="At least 8 characters"
            icon="lock-outline"
            secure
            inputRef={passwordRef}
            autoComplete="new-password"
            textContentType="newPassword"
            passwordRules="minlength: 8;"
            returnKeyType="go"
            onSubmitEditing={() => form.handleSubmit()}
            accessibilityLabel="Password"
          />
        )}
      </form.Field>

      {serverError ? <AuthErrorBanner message={serverError} /> : null}

      <AuthPrimaryButton
        label="Create account"
        loading={registerMutation.isPending}
        onPress={() => form.handleSubmit()}
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Already have an account?
        </Text>
        <AuthTextLink
          label="Sign in"
          onPress={() => router.replace("/(auth)/login")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
