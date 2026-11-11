import { useRef, useState, type ComponentRef } from "react";
import { TextInput, View } from "react-native";
import { useForm } from "@tanstack/react-form";
import { Text } from "@/components/ui/text";
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

export const LoginForm = ({ initialEmail }: { initialEmail?: string }) => {
  const loginMutation = useLogin();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [serverError, setServerError] = useState<string>();

  const form = useForm({
    defaultValues: {
      email: initialEmail ?? "",
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
            placeholder="Enter your password"
            value={field.state.value}
            onChangeText={(value) => {
              field.handleChange(value);
              if (serverError) setServerError(undefined);
            }}
            onBlur={field.handleBlur}
            error={firstFieldError(field.state.meta.errors)}
            icon="lock"
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

      <View className="items-end -mt-0.5 mb-3">
        <AuthTextLink
          label="Forgot password?"
          align="flex-end"
          tone="muted"
          href="/(auth)/forgot-password"
        />
      </View>

      {serverError ? <AuthErrorBanner message={serverError} /> : null}
      {serverError?.toLowerCase().includes("activ") ? (
        <View className="mb-3">
          <AuthTextLink
            label="Activate your account"
            align="flex-start"
            href="/(auth)/activate"
          />
        </View>
      ) : null}

      <AuthPrimaryButton
        label="Sign in"
        loading={loginMutation.isPending}
        onPress={() => form.handleSubmit()}
      />

      <View className="mt-8 items-center">
        <View className="mb-4 flex-row items-center gap-3 w-full max-w-[280px]">
          <View className="flex-1 h-px bg-white/[0.08]" />
          <Text className="text-[11px] text-zinc-500 font-brandMedium tracking-wider">
            OR
          </Text>
          <View className="flex-1 h-px bg-white/[0.08]" />
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-zinc-400 text-xs font-brand">
            New to Glimpse?
          </Text>
          <AuthTextLink label="Create an account" href="/(auth)/register" />
        </View>
      </View>
    </View>
  );
};
