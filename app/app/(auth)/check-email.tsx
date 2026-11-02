import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";
import AuthShell from "@/features/auth/components/auth-shell";
import {
  AuthPrimaryButton,
  AuthTextLink,
} from "@/features/auth/components/auth-actions";

export default function CheckEmail() {
  const theme = useAppTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <AuthShell
      title="Check your inbox."
      subtitle={
        email
          ? `We sent an activation link to ${email}.`
          : "We sent you an activation link."
      }
    >
      <View style={styles.body}>
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
            name="email-fast-outline"
            size={30}
            color={theme.colors.gold}
          />
        </View>

        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          Open the link on this device to activate your account. If nothing
          arrives, check your spam folder.
        </Text>

        <AuthPrimaryButton
          label="I have an activation code"
          onPress={() =>
            router.push({
              pathname: "/(auth)/activate",
              params: email ? { email } : undefined,
            })
          }
        />
        <AuthTextLink
          label="Back to sign in"
          onPress={() => router.replace("/(auth)/login")}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  body: {
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
  text: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
