import { StyleSheet, View } from "react-native";
import { Text, useTheme, ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import StepLayout from "@/features/onboarding/components/step-layout";
import GenreSelector from "@/features/onboarding/components/genre-selector";
import { useOnboardingData } from "@/features/onboarding/hooks/queries/use-onboarding-data";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";

export default function DislikedGenresScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useOnboardingData();
  const excludedGenres = useOnboardingStore((s) => s.excludedGenres);
  const setExcludedGenres = useOnboardingStore((s) => s.setExcludedGenres);

  const handleNext = (selectedIds: number[]) => {
    setExcludedGenres(selectedIds);
    router.push("/(onboarding)/rating");
  };

  if (isLoading) {
    return (
      <StepLayout step={3} totalSteps={5} title="Avoid Genres">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            variant="bodyMedium"
            style={{ color: colors.onSurfaceVariant, marginTop: 16 }}
          >
            Almost there...
          </Text>
        </View>
      </StepLayout>
    );
  }

  if (error || !data) {
    return (
      <StepLayout step={3} totalSteps={5} title="Avoid Genres">
        <View style={styles.center}>
          <Text
            variant="bodyLarge"
            style={{
              color: colors.error,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Something went wrong.
          </Text>
          <Button variant="outline" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      </StepLayout>
    );
  }

  return (
    <StepLayout step={3} totalSteps={5} title="Avoid Genres">
      <GenreSelector
        genres={data.genres}
        initialSelected={excludedGenres}
        onNext={handleNext}
        onBack={() => router.back()}
        subtitle="Select genres you want to see less of. This is optional."
        buttonLabel="Next Step"
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
