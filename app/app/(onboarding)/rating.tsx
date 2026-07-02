import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import StepLayout from "@/features/onboarding/components/step-layout";
import RatingSelector from "@/features/onboarding/components/rating-selector";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { useFinishOnboarding } from "@/features/onboarding/hooks/mutations/use-finish-onboarding";
import { useRouter } from "expo-router";

export default function RatingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    favoriteGenres,
    excludedGenres,
    languages,
    minYear,
    maxYear,
    minRating,
    setMinRating,
  } = useOnboardingStore();

  const { mutate: finish, isPending } = useFinishOnboarding();

  const handleFinish = (rating: number) => {
    setMinRating(rating);
    finish({
      favorite_genres: favoriteGenres,
      excluded_genres: excludedGenres,
      languages: languages,
      min_year: minYear ?? 1888,
      max_year: maxYear ?? 2026,
      min_rating: rating,
    });
  };

  return (
    <StepLayout step={4} totalSteps={5} title="Final Filter">
      <RatingSelector
        initialRating={minRating}
        onFinish={handleFinish}
        onBack={() => router.back()}
        isSubmitting={isPending}
      />
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
