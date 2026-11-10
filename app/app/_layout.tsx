import "../global.css";
import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack, router, useSegments, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "@/lib/query-provider";
import { useOnlineManager } from "@/hooks/use-online-manager";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { ThemeProvider } from "@react-navigation/native";
import { glimpseDarkTheme, glimpseNavigationTheme, toastConfig } from "@/lib/theme";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useGetPreferences } from "@/features/onboarding/hooks/queries/use-get-preferences";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { useFinishOnboarding } from "@/features/onboarding/hooks/mutations/use-finish-onboarding";
import AnimatedSplashScreen from "@/components/ui/animated-splash-screen";

SplashScreen.preventAutoHideAsync();
void SystemUI.setBackgroundColorAsync("#0C0C0E");

export default function RootLayout() {
  useOnlineManager();
  const { isAuthenticated, isRestoring, restoreToken } = useAuthStore();
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,

    // Aliased to Plus Jakarta Sans for instant app-wide upgrade
    Inter_400Regular: PlusJakartaSans_400Regular,
    Inter_500Medium: PlusJakartaSans_500Medium,
    Inter_600SemiBold: PlusJakartaSans_600SemiBold,
    Inter_700Bold: PlusJakartaSans_700Bold,
    Inter_900Black: PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  const isReady = !isRestoring && (loaded || !!error);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0C0C0E" }}>
      <QueryProvider>
        <PaperProvider theme={glimpseDarkTheme}>
          <ThemeProvider value={glimpseNavigationTheme}>
            {isReady ? <RootNavigator isAuthenticated={isAuthenticated} /> : null}
            <AnimatedSplashScreen isReady={isReady} />
            <Toast config={toastConfig} />
          </ThemeProvider>
        </PaperProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ isAuthenticated }: { isAuthenticated: boolean }) {
  const segments = useSegments();
  const currentGroup = segments[0];
  const { data, isFetched: isPreferenceFetched } =
    useGetPreferences(isAuthenticated);
  const isOnboarded = !!data?.preference?.favorite_genres?.length;

  const {
    favoriteGenres,
    excludedGenres,
    languages,
    minYear,
    maxYear,
    minRating,
    hasCompletedLocalOnboarding,
  } = useOnboardingStore();

  const { mutate: syncPreferences, isPending: isSyncing } =
    useFinishOnboarding();

  useEffect(() => {
    if (isAuthenticated && hasCompletedLocalOnboarding && !isSyncing) {
      syncPreferences({
        favorite_genres: favoriteGenres,
        excluded_genres: excludedGenres,
        languages: languages.length > 0 ? languages : ["en"],
        min_year: minYear ?? 1888,
        max_year: maxYear ?? 2026,
        min_rating: minRating ?? 0,
      });
    }
  }, [
    isAuthenticated,
    hasCompletedLocalOnboarding,
    isSyncing,
    favoriteGenres,
    excludedGenres,
    languages,
    minYear,
    maxYear,
    minRating,
    syncPreferences,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (currentGroup === "(auth)" || currentGroup === "(onboarding)") return;
      router.replace("/(auth)/welcome");
      return;
    }

    if (hasCompletedLocalOnboarding || isSyncing) return;

    if (!isPreferenceFetched) return;

    if (isOnboarded) {
      if (currentGroup === "(app)") return;
      router.replace("/(app)/(tabs)");
    } else {
      if (currentGroup === "(onboarding)") return;
      router.replace("/(onboarding)");
    }
  }, [
    currentGroup,
    isAuthenticated,
    isPreferenceFetched,
    isOnboarded,
    hasCompletedLocalOnboarding,
    isSyncing,
  ]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0C0C0E" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
