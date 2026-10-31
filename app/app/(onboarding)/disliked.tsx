import { StyleSheet, View } from "react-native";
import { Text, useTheme, ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import StepLayout from "@/features/onboarding/components/step-layout";
import ExcludedGenreSelector from "@/features/onboarding/components/excluded-genre-selector";
import { useOnboardingData } from "@/features/onboarding/hooks/queries/use-onboarding-data";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { useFinishOnboarding } from "@/features/onboarding/hooks/mutations/use-finish-onboarding";

export default function DislikedGenresScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useOnboardingData();
  const {
    favoriteGenres,
    excludedGenres,
    languages,
    minYear,
    maxYear,
    minRating,
    setExcludedGenres,
  } = useOnboardingStore();

  const { mutate: finish, isPending } = useFinishOnboarding();

  const handleFinish = (selectedExcludedIds: number[]) => {
    setExcludedGenres(selectedExcludedIds);

    finish({
      favorite_genres: favoriteGenres,
      excluded_genres: selectedExcludedIds,
      languages: languages.length > 0 ? languages : ["en"],
      min_year: minYear ?? 1888,
      max_year: maxYear ?? 2026,
      min_rating: minRating ?? 0,
    });
  };

  if (isLoading) {
    return (
      <StepLayout
        step={3}
        totalSteps={4}
        title="Any Dealbreakers?"
        subtitle="Almost there..."
        onBack={() => router.back()}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </StepLayout>
    );
  }

  if (error || !data) {
    return (
      <StepLayout
        step={3}
        totalSteps={4}
        title="Any Dealbreakers?"
        subtitle="Failed to load options"
        onBack={() => router.back()}
      >
        <View style={styles.center}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.error, marginBottom: 16 }}
          >
            Failed to load genres.
          </Text>
          <Button variant="outline" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      step={3}
      totalSteps={4}
      title="Any Dealbreakers?"
      subtitle="Select genres you want completely excluded from your recommendations"
      onBack={() => router.back()}
    >
      <ExcludedGenreSelector
        genres={data.genres}
        initialSelected={excludedGenres}
        favoriteGenreIds={favoriteGenres}
        onFinish={handleFinish}
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
