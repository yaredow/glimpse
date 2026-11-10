import { router } from "expo-router";
import StepLayout from "@/features/onboarding/components/step-layout";
import GenreSelector from "@/features/onboarding/components/genre-selector";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { ONBOARDING_GENRES } from "@/features/onboarding/constants/onboarding-data";

export default function FavoriteGenresScreen() {
  const storedGenres = useOnboardingStore((s) => s.favoriteGenres);
  const setFavoriteGenres = useOnboardingStore((s) => s.setFavoriteGenres);

  const handleNext = (selectedIds: number[]) => {
    setFavoriteGenres(selectedIds);
    router.push("/(onboarding)/era");
  };

  return (
    <StepLayout
      step={0}
      totalSteps={4}
      title="Your Film DNA"
      subtitle="Choose at least 2 genres that define what you love to watch"
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(auth)/welcome");
        }
      }}
    >
      <GenreSelector
        genres={ONBOARDING_GENRES}
        initialSelected={storedGenres}
        onNext={handleNext}
        minSelection={2}
      />
    </StepLayout>
  );
}
