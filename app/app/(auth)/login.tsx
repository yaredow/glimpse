import { useLocalSearchParams } from "expo-router";
import { LoginForm } from "@/features/auth/components/login-form";
import AuthShell from "@/features/auth/components/auth-shell";

export default function Login() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Your nightly five are waiting."
    >
      <LoginForm initialEmail={email} />
    </AuthShell>
  );
}
