import { RegisterForm } from "@/features/auth/components/register-form";
import AuthShell from "@/features/auth/components/auth-shell";

export default function Register() {
  return (
    <AuthShell
      title="Start your ritual."
      subtitle="Create an account and get five handpicked films every night."
      compact
    >
      <RegisterForm />
    </AuthShell>
  );
}
