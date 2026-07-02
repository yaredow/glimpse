import { StyleSheet, View } from "react-native";
import { Text, useTheme, ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import StepLayout from "@/features/onboarding/components/step-layout";
import LanguageSelector from "@/features/onboarding/components/language-selector";
import { useOnboardingData } from "@/features/onboarding/hooks/queries/use-onboarding-data";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";

export default function LanguageScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useOnboardingData();
  const storedLanguages = useOnboardingStore((s) => s.languages);
  const setLanguages = useOnboardingStore((s) => s.setLanguages);

  const handleNext = (selectedCodes: string[]) => {
    setLanguages(selectedCodes);
    router.push("/(onboarding)/disliked");
  };

  if (isLoading) {
    return (
      <StepLayout step={2} totalSteps={5} title="Languages">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </StepLayout>
    );
  }

  if (error || !data) {
    return (
      <StepLayout step={2} totalSteps={5} title="Languages">
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
    <StepLayout step={2} totalSteps={5} title="Languages">
      <LanguageSelector
        languages={data.languages}
        initialSelected={storedLanguages}
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
