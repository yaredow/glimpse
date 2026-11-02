import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";
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
  const theme = useAppTheme();
  const { token: tokenParam, email } = useLocalSearchParams<{
    token?: string;
    email?: string;
  }>();
  const activateMutation = useActivateUser();
  const [token, setToken] = useState(tokenParam ?? "");
  const [serverError, setServerError] = useState<string>();
  const [activated, setActivated] = useState(false);

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
        subtitle="Your account is activated."
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
            Sign in to start your nightly five.
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
      title="Activate your account."
      subtitle={
        email
          ? `Enter the activation code sent to ${email}.`
          : "Enter the activation code sent to your email."
      }
    >
      <AuthField
        label="Activation code"
        value={token}
        onChangeText={(value) => {
          setToken(value);
          if (serverError) setServerError(undefined);
        }}
        hint="The code is case-sensitive. You can paste it from your email."
        icon="key-outline"
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

      <View style={styles.footer}>
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>
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
    gap: 10,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  helper: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
