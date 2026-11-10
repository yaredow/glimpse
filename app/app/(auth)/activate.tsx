import { useEffect, useState } from "react";
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

export default function Activate() {
  const { token: tokenParam, email } = useLocalSearchParams<{
    token?: string;
    email?: string;
  }>();
  const activateMutation = useActivateUser();
  const [token, setToken] = useState(tokenParam ?? "");
  const [serverError, setServerError] = useState<string>();
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (activated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
      const timer = setTimeout(() => {
        router.replace("/(auth)/login");
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [activated]);

  const handleActivate = () => {
    if (!token.trim()) {
      setServerError("Enter the activation code from your email.");
      return;
    }

    setServerError(undefined);
    activateMutation.mutate(token.trim(), {
      onSuccess: () => setActivated(true),
      onError: async (error) => {
        setServerError(await getErrorMessage(error));
      },
    });
  };

  if (activated) {
    return (
      <AuthShell
        title="You're in."
        subtitle="Your account is activated. Redirecting you to sign in..."
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
            Sign in to start your nightly five.
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
      title="Activate your account."
      subtitle={
        email
          ? `Enter the activation code sent to ${email}.`
          : "Enter the activation code sent to your email."
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
          onPress={() => router.replace("/(auth)/login")}
        />
      </View>
    </AuthShell>
  );
}
