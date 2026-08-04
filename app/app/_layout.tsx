import { useFonts } from "expo-font";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "@/lib/query-provider";
import { useOnlineManager } from "@/hooks/use-online-manager";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { netflixTheme } from "@/lib/colors";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useGetPreferences } from "@/features/onboarding/hooks/queries/use-get-preferences";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useOnlineManager();
  const { isAuthenticated, isRestoring, restoreToken } = useAuthStore();
  const [loaded, error] = useFonts({
    Inter_400Regular: require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf"),
    Inter_600SemiBold: require("@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf"),
    Inter_700Bold: require("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
    Inter_900Black: require("@expo-google-fonts/inter/900Black/Inter_900Black.ttf"),
  });

  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  useEffect(() => {
    if (!isRestoring && (loaded || error)) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isRestoring]);

  if ((!loaded && !error) || isRestoring) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <PaperProvider theme={netflixTheme}>
          <RootNavigator isAuthenticated={isAuthenticated} />
        </PaperProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ isAuthenticated }: { isAuthenticated: boolean }) {
  const segments = useSegments();
  const currentGroup = segments[0];
  const {
    data,
    isLoading: isPreferenceLoading,
    isFetched: isPreferenceFetched,
  } = useGetPreferences(isAuthenticated);
  const isOnboarded = !!data?.preference?.favorite_genres?.length;

  useEffect(() => {
    if (!isPreferenceFetched) return;

    if (isAuthenticated && isOnboarded) {
      if (currentGroup === "(app)") return;
      router.replace("/(app)/(tabs)");
    } else if (isAuthenticated && !isOnboarded) {
      if (currentGroup === "(onboarding)") return;
      router.replace("/(onboarding)");
    } else {
      if (currentGroup === "(auth)") return;
      router.replace("/(auth)/login");
    }
  }, [currentGroup, isAuthenticated, isPreferenceFetched, isOnboarded]);

  if (isAuthenticated && isPreferenceLoading) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isAuthenticated && !isOnboarded}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated && isOnboarded}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <Toast />
    </>
  );
}
