import { Stack } from "expo-router";
import { palette } from "@/lib/theme/colors";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: palette.appBackground },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="era" />
      <Stack.Screen name="language" />
      <Stack.Screen name="disliked" />
    </Stack>
  );
}
