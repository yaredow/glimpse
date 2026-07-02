import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import { loginSchema, type LoginFormData } from "../schemas/auth.schema";
import { useLogin } from "../hooks/mutations/use-login";

export const LoginForm = () => {
  const { colors } = useTheme();
  const { mutate: loginUser, isPending } = useLogin();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginFormData,
    onSubmit: async ({ value }) => {
      loginUser(value);
    },
    validators: {
      onSubmit: loginSchema,
    },
  });

  return (
    <View>
      <Text variant="headlineLarge" style={styles.title}>
        Login
      </Text>

      <form.Field name="email">
        {(field) => (
          <View style={styles.field}>
            <TextInput
              label="Email"
              mode="outlined"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {field.state.meta.errors ? (
              <Text
                variant="bodySmall"
                style={{ color: colors.error, marginLeft: 12 }}
              >
                {(field.state.meta.errors as { message: string }[])
                  .map((e) => e.message)
                  .join(", ")}
              </Text>
            ) : null}
          </View>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <View style={styles.field}>
            <TextInput
              label="Password"
              mode="outlined"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              secureTextEntry
            />
            {field.state.meta.errors ? (
              <Text
                variant="bodySmall"
                style={{ color: colors.error, marginLeft: 12 }}
              >
                {(field.state.meta.errors as { message: string }[])
                  .map((e) => e.message)
                  .join(", ")}
              </Text>
            ) : null}
          </View>
        )}
      </form.Field>

      <Button
        mode="contained"
        onPress={() => form.handleSubmit()}
        style={styles.button}
        loading={isPending}
        disabled={isPending}
      >
        Sign In
      </Button>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
          Don&apos;t have an account?{" "}
        </Text>
        <Button
          mode="text"
          compact
          onPress={() => router.push("/(auth)/register")}
          labelStyle={styles.linkLabel}
        >
          Sign Up
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
    marginBottom: 32,
  },
  field: {
    marginBottom: 20,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  linkLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
});
