import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, TextInput, useTheme, Text } from "react-native-paper";
import { useActivateUser } from "../../features/auth/hooks/mutations/use-activate-user";

export default function Activate() {
  const { colors } = useTheme();
  const { mutate: activate, isPending } = useActivateUser();
  const [token, setToken] = useState("");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="headlineLarge" style={styles.title}>
        Activate Account
      </Text>

      <Text
        variant="bodyMedium"
        style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
      >
        Enter the activation token sent to your email
      </Text>

      <TextInput
        label="Activation Token"
        mode="outlined"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={() => activate(token)}
        loading={isPending}
        disabled={isPending || !token}
        style={styles.button}
      >
        Activate
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
});
