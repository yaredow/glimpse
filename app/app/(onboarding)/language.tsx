import { router } from "expo-router";
import StepLayout from "@/features/onboarding/components/step-layout";
import LanguageRatingSelector from "@/features/onboarding/components/language-rating-selector";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { ONBOARDING_LANGUAGES } from "@/features/onboarding/constants/onboarding-data";

export default function LanguageScreen() {
  const storedLanguages = useOnboardingStore((s) => s.languages);
  const storedRating = useOnboardingStore((s) => s.minRating);
  const setLanguages = useOnboardingStore((s) => s.setLanguages);
  const setMinRating = useOnboardingStore((s) => s.setMinRating);

  const handleNext = (selectedCodes: string[], rating: number) => {
    setLanguages(selectedCodes);
    setMinRating(rating);
    router.push("/(onboarding)/disliked");
  };

  return (
    <StepLayout
      step={2}
      totalSteps={4}
      title="Languages & Quality"
      subtitle="Set your spoken language preferences and minimum rating standard"
      onBack={() => router.back()}
    >
      <LanguageRatingSelector
        languages={ONBOARDING_LANGUAGES}
        initialLanguages={storedLanguages}
        initialRating={storedRating}
        onNext={handleNext}
        onBack={() => router.back()}
      />
    </StepLayout>
  );
}
