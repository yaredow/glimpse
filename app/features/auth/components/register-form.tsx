import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import { registerSchema, type RegisterFormData } from "../schemas/auth.schema";
import { useRegister } from "../hooks/mutations/use-register";

export const RegisterForm = () => {
  const { colors } = useTheme();
  const { mutate: registerUser, isPending } = useRegister();

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
    } as RegisterFormData,
    onSubmit: async ({ value }) => {
      registerUser(value);
    },
    validators: {
      onSubmit: registerSchema,
    },
  });

  return (
    <View>
      <Text variant="headlineLarge" style={styles.title}>
        Create Account
      </Text>

      <form.Field name="username">
        {(field) => (
          <View style={styles.field}>
            <TextInput
              label="Username"
              mode="outlined"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
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
        loading={isPending}
        disabled={isPending}
        style={styles.button}
      >
        Sign Up
      </Button>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
          Already have an account?{" "}
        </Text>
        <Button
          mode="text"
          compact
          onPress={() => router.push("/(auth)/login")}
          labelStyle={styles.linkLabel}
        >
          Sign In
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
