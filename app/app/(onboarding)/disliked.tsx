import { router } from "expo-router";
import StepLayout from "@/features/onboarding/components/step-layout";
import ExcludedGenreSelector from "@/features/onboarding/components/excluded-genre-selector";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { useFinishOnboarding } from "@/features/onboarding/hooks/mutations/use-finish-onboarding";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { ONBOARDING_GENRES } from "@/features/onboarding/constants/onboarding-data";

export default function DislikedGenresScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    favoriteGenres,
    excludedGenres,
    languages,
    minYear,
    maxYear,
    minRating,
    setExcludedGenres,
    setHasCompletedLocalOnboarding,
  } = useOnboardingStore();

  const { mutate: finish, isPending } = useFinishOnboarding();

  const handleFinish = (selectedExcludedIds: number[]) => {
    setExcludedGenres(selectedExcludedIds);

    if (!isAuthenticated) {
      setHasCompletedLocalOnboarding(true);
      router.replace("/(auth)/register");
      return;
    }

    finish({
      favorite_genres: favoriteGenres,
      excluded_genres: selectedExcludedIds,
      languages: languages.length > 0 ? languages : ["en"],
      min_year: minYear ?? 1888,
      max_year: maxYear ?? new Date().getFullYear(),
      min_rating: minRating ?? 0,
    });
  };

  return (
    <StepLayout
      step={3}
      totalSteps={4}
      title="Anything to avoid?"
      subtitle="Select genres you want completely excluded from your recommendations"
      onBack={() => router.back()}
    >
      <ExcludedGenreSelector
        genres={ONBOARDING_GENRES}
        initialSelected={excludedGenres}
        favoriteGenreIds={favoriteGenres}
        onFinish={handleFinish}
        isSubmitting={isPending}
      />
    </StepLayout>
  );
}
