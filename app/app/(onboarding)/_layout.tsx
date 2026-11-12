import { Stack } from "expo-router";
import { colors } from "@/lib/theme/tokens.generated";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="era" />
      <Stack.Screen name="language" />
      <Stack.Screen name="disliked" />
    </Stack>
  );
}
