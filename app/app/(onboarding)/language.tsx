import { StyleSheet, View } from "react-native";
import { Text, useTheme, ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import StepLayout from "@/features/onboarding/components/step-layout";
import LanguageRatingSelector from "@/features/onboarding/components/language-rating-selector";
import { useOnboardingData } from "@/features/onboarding/hooks/queries/use-onboarding-data";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";

export default function LanguageScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useOnboardingData();
  const storedLanguages = useOnboardingStore((s) => s.languages);
  const storedRating = useOnboardingStore((s) => s.minRating);
  const setLanguages = useOnboardingStore((s) => s.setLanguages);
  const setMinRating = useOnboardingStore((s) => s.setMinRating);

  const handleNext = (selectedCodes: string[], rating: number) => {
    setLanguages(selectedCodes);
    setMinRating(rating);
    router.push("/(onboarding)/disliked");
  };

  if (isLoading) {
    return (
      <StepLayout
        step={2}
        totalSteps={4}
        title="Languages & Quality"
        subtitle="Loading preferences..."
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
        step={2}
        totalSteps={4}
        title="Languages & Quality"
        subtitle="Unable to load options"
        onBack={() => router.back()}
      >
        <View style={styles.center}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.error, marginBottom: 16 }}
          >
            Failed to load languages.
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
      step={2}
      totalSteps={4}
      title="Languages & Quality"
      subtitle="Set your spoken language preferences and minimum rating standard"
      onBack={() => router.back()}
    >
      <LanguageRatingSelector
        languages={data.languages}
        initialLanguages={storedLanguages}
        initialRating={storedRating}
        onNext={handleNext}
        onBack={() => router.back()}
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
