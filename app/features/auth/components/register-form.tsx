import { useRef, useState, type ComponentRef } from "react";
import { TextInput, View } from "react-native";
import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
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
            placeholder="Enter your name"
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            icon="user"
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
            placeholder="Enter your email"
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            icon="email"
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
            placeholder="Create a password"
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

      <View className="mt-8 items-center">
        <View className="mb-4 flex-row items-center gap-3 w-full max-w-[280px]">
          <View className="flex-1 h-px bg-white/[0.08]" />
          <Text className="text-[11px] text-faint-foreground font-brandMedium tracking-wider">
            OR
          </Text>
          <View className="flex-1 h-px bg-white/[0.08]" />
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-subtle-foreground text-xs font-brand">
            Already have an account?
          </Text>
          <AuthTextLink label="Sign in" href="/(auth)/login" />
        </View>
      </View>
    </View>
  );
};
