import { StyleSheet, View } from "react-native";
import { Text, useTheme, ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import StepLayout from "@/features/onboarding/components/step-layout";
import EraSelector from "@/features/onboarding/components/era-selector";
import { useOnboardingData } from "@/features/onboarding/hooks/queries/use-onboarding-data";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { Button } from "@/components/ui/button";

export default function EraScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useOnboardingData();
  const { minYear, maxYear, setEra } = useOnboardingStore();

  const handleNext = (min: number, max: number) => {
    setEra(min, max);
    router.push("/(onboarding)/language");
  };

  if (isLoading) {
    return (
      <StepLayout step={1} totalSteps={5} title="Movie Era">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </StepLayout>
    );
  }

  if (error || !data) {
    return (
      <StepLayout step={1} totalSteps={5} title="Movie Era">
        <View style={styles.center}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.error, marginBottom: 16 }}
          >
            Failed to load eras.
          </Text>
          <Button variant="outline" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      </StepLayout>
    );
  }

  const initialSelected =
    minYear !== null && maxYear !== null
      ? { min_year: minYear as number, max_year: maxYear as number }
      : null;

  return (
    <StepLayout step={1} totalSteps={5} title="Movie Era">
      <EraSelector
        eras={data.eras}
        initialSelected={initialSelected}
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
