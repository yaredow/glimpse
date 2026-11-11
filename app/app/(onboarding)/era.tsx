import { router } from "expo-router";
import StepLayout from "@/features/onboarding/components/step-layout";
import EraSelector from "@/features/onboarding/components/era-selector";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { ONBOARDING_ERAS } from "@/features/onboarding/constants/onboarding-data";

export default function EraScreen() {
  const { minYear, maxYear, setEra } = useOnboardingStore();

  const handleNext = (min: number, max: number) => {
    setEra(min, max);
    router.push("/(onboarding)/language");
  };

  const initialEra =
    minYear !== null && maxYear !== null
      ? { min_year: minYear, max_year: maxYear }
      : null;

  return (
    <StepLayout
      step={1}
      totalSteps={4}
      title="Set the era"
      subtitle="Select the release period that matches your taste"
      onBack={() => router.back()}
    >
      <EraSelector
        eras={ONBOARDING_ERAS}
        initialSelected={initialEra}
        onNext={handleNext}
      />
    </StepLayout>
  );
}
