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
import fontFamilies from "@/lib/theme/fonts.json";
import { Stack, router, useSegments, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "@/lib/query-provider";
import { useOnlineManager } from "@/hooks/use-online-manager";
import { useEffect } from "react";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { glimpseNavigationTheme, toastConfig } from "@/lib/theme";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useGetPreferences } from "@/features/onboarding/hooks/queries/use-get-preferences";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { useFinishOnboarding } from "@/features/onboarding/hooks/mutations/use-finish-onboarding";
import AnimatedSplashScreen from "@/components/ui/animated-splash-screen";
import { colors } from "@/lib/theme/tokens.generated";

SplashScreen.preventAutoHideAsync();
void SystemUI.setBackgroundColorAsync(colors.background);

export default function RootLayout() {
  useOnlineManager();
  const {
    isAuthenticated,
    isRestoring,
    hasAuthenticated,
    hasSeenWelcome,
    restoreToken,
  } = useAuthStore();
  const [loaded, error] = useFonts({
    [fontFamilies.regular]: PlusJakartaSans_400Regular,
    [fontFamilies.medium]: PlusJakartaSans_500Medium,
    [fontFamilies.semiBold]: PlusJakartaSans_600SemiBold,
    [fontFamilies.bold]: PlusJakartaSans_700Bold,
    [fontFamilies.extraBold]: PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  const isReady = !isRestoring && (loaded || !!error);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <QueryProvider>
        <ThemeProvider value={glimpseNavigationTheme}>
          {isReady ? (
            <RootNavigator
              isAuthenticated={isAuthenticated}
              hasAuthenticated={hasAuthenticated}
              hasSeenWelcome={hasSeenWelcome}
            />
          ) : null}
          <AnimatedSplashScreen isReady={isReady} />
          <Toast config={toastConfig} />
          <PortalHost />
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({
  isAuthenticated,
  hasAuthenticated,
  hasSeenWelcome,
}: {
  isAuthenticated: boolean;
  hasAuthenticated: boolean;
  hasSeenWelcome: boolean;
}) {
  const segments = useSegments();
  const currentGroup = segments[0];
  const { data, isFetched: isPreferenceFetched, isError: isPreferencesError } =
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
      router.replace(
        hasSeenWelcome || hasAuthenticated ? "/(auth)/login" : "/(auth)/welcome",
      );
      return;
    }

    if (hasCompletedLocalOnboarding || isSyncing) return;

    if (isPreferencesError) return;

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
    hasAuthenticated,
    hasSeenWelcome,
    isPreferenceFetched,
    isPreferencesError,
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
          contentStyle: { backgroundColor: colors.background },
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
