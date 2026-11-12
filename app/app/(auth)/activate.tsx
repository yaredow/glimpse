import { useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { CheckCircleIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/error";
import { useActivateUser } from "@/features/auth/hooks/mutations/use-activate-user";
import AuthShell from "@/features/auth/components/auth-shell";
import AuthField from "@/features/auth/components/auth-field";
import {
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthTextLink,
} from "@/features/auth/components/auth-actions";
import { colors } from "@/lib/theme/tokens.generated";

export default function Activate() {
  const { token: tokenParam, email } = useLocalSearchParams<{
    token?: string;
    email?: string;
  }>();
  const activateMutation = useActivateUser();
  const [token, setToken] = useState(tokenParam ?? "");
  const [serverError, setServerError] = useState<string>();
  const [activated, setActivated] = useState(false);

  const activatedEmail = activateMutation.data?.email ?? email;

  const handleActivation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    setActivated(true);
  };

  const handleActivate = () => {
    if (!token.trim()) {
      setServerError("Enter the activation code from your email.");
      return;
    }

    setServerError(undefined);
    activateMutation.mutate(token.trim(), {
      onSuccess: handleActivation,
      onError: async (error) => {
        setServerError(await getErrorMessage(error));
      },
    });
  };

  if (activated) {
    return (
      <AuthShell title="You&apos;re in." subtitle="Your account is activated.">
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{ alignItems: "center", gap: 16, width: "100%" }}
        >
          <Animated.View
            entering={ZoomIn.duration(450).springify()}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 1,
              borderColor: "rgba(16, 185, 129, 0.3)",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 8,
              marginBottom: 8,
              boxShadow: "0px 8px 16.0px rgba(2, 44, 34, 0.4)",
            }}
          >
            <CheckCircleIcon size={40} color={colors.success} weight="fill" />
          </Animated.View>
          <Text className="text-zinc-400 text-xs leading-5 text-center px-4">
            Sign in to start your nightly five.
          </Text>
          <AuthPrimaryButton
            label="Sign in now"
            onPress={() =>
              router.replace({
                pathname: "/(auth)/login",
                params: activatedEmail ? { email: activatedEmail } : undefined,
              })
            }
          />
        </Animated.View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Activate your account."
      subtitle={
        email
          ? `Enter the activation code sent to ${email}.`
          : "Enter the activation code sent to your email."
      }
      onBack={() =>
        router.canGoBack() ? router.back() : router.replace("/(auth)/login")
      }
    >
      <AuthField
        label="Activation code"
        placeholder="Enter activation code"
        value={token}
        onChangeText={(value) => {
          setToken(value);
          if (serverError) setServerError(undefined);
        }}
        hint="The code is case-sensitive. You can paste it from your email."
        icon="key"
        autoComplete="off"
        textContentType="none"
        returnKeyType="go"
        onSubmitEditing={handleActivate}
        accessibilityLabel="Activation code"
      />

      {serverError ? <AuthErrorBanner message={serverError} /> : null}

      <AuthPrimaryButton
        label="Activate account"
        loading={activateMutation.isPending}
        onPress={handleActivate}
      />

      <View className="items-center gap-2.5 mt-8 pt-5 border-t border-white/[0.08]">
        <Text className="text-zinc-500 text-[11px] text-center">
          Didn&apos;t get the email? Check your spam folder.
        </Text>
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

