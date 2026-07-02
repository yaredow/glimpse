import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { RegisterForm } from "../../features/auth/components/register-form";

export default function Register() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RegisterForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
