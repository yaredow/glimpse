import { StyleSheet, View } from "react-native";
import { Text, useTheme, ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import StepLayout from "@/features/onboarding/components/step-layout";
import GenreSelector from "@/features/onboarding/components/genre-selector";
import { useOnboardingData } from "@/features/onboarding/hooks/queries/use-onboarding-data";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";

export default function FavoriteGenresScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useOnboardingData();
  const storedGenres = useOnboardingStore((s) => s.favoriteGenres);
  const setFavoriteGenres = useOnboardingStore((s) => s.setFavoriteGenres);

  const handleNext = (selectedIds: number[]) => {
    setFavoriteGenres(selectedIds);
    router.push("/(onboarding)/era");
  };

  if (isLoading) {
    return (
      <StepLayout
        step={0}
        totalSteps={4}
        title="Your Film DNA"
        subtitle="Finding your vibe..."
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
        step={0}
        totalSteps={4}
        title="Your Film DNA"
        subtitle="Unable to load genres right now"
      >
        <View style={styles.center}>
          <Text
            variant="bodyMedium"
            style={{ color: colors.error, marginBottom: 16 }}
          >
            Failed to connect to the server.
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
      step={0}
      totalSteps={4}
      title="Your Film DNA"
      subtitle="Choose at least 2 genres that define what you love to watch"
    >
      <GenreSelector
        genres={data.genres}
        initialSelected={storedGenres}
        onNext={handleNext}
        minSelection={2}
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
