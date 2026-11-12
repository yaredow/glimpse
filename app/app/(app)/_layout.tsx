import { Stack } from "expo-router";
import { colors } from "@/lib/theme/tokens.generated";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.surface1 },
        headerStyle: { backgroundColor: colors.surface5 },
        headerTintColor: colors.offWhite,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="movies/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
