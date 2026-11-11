import { RegisterForm } from "@/features/auth/components/register-form";
import AuthShell from "@/features/auth/components/auth-shell";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";

export default function Register() {
  const hasCompletedLocalOnboarding = useOnboardingStore(
    (s) => s.hasCompletedLocalOnboarding,
  );

  return (
    <AuthShell
      title={hasCompletedLocalOnboarding ? "One last step." : "Create your account."}
      subtitle={
        hasCompletedLocalOnboarding
          ? "Your picks are saved. Create an account to unlock your first five."
          : "Five handpicked films, every night."
      }
      compact
    >
      <RegisterForm />
    </AuthShell>
  );
}
