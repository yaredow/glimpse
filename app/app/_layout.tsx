import { useFonts } from "expo-font";
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
import AnimatedSplashScreen from "@/components/ui/animated-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useOnlineManager();
  const { isAuthenticated, isRestoring, restoreToken } = useAuthStore();
  const [loaded, error] = useFonts({
    Inter_400Regular: require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf"),
    Inter_500Medium: require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
    Inter_600SemiBold: require("@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf"),
    Inter_700Bold: require("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
    Inter_900Black: require("@expo-google-fonts/inter/900Black/Inter_900Black.ttf"),
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

  useEffect(() => {
    if (!isAuthenticated) {
      if (currentGroup === "(auth)") return;
      router.replace("/(auth)/login");
      return;
    }

    if (!isPreferenceFetched) return;

    if (isOnboarded) {
      if (currentGroup === "(app)") return;
      router.replace("/(app)/(tabs)");
    } else {
      if (currentGroup === "(onboarding)") return;
      router.replace("/(onboarding)");
    }
  }, [currentGroup, isAuthenticated, isPreferenceFetched, isOnboarded]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
