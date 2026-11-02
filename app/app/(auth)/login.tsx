import { LoginForm } from "@/features/auth/components/login-form";
import AuthShell from "@/features/auth/components/auth-shell";

export default function Login() {
  return (
    <AuthShell
      title="Welcome back."
      subtitle="Your nightly five are waiting."
    >
      <LoginForm />
    </AuthShell>
  );
}
