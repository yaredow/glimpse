import type { ExpoConfig } from "expo/config";
import * as tokens from "./lib/theme/tokens.generated.json";

const config: ExpoConfig = {
  name: "GLIMPSE",
  slug: "glimpse-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "glimpseapp",
  userInterfaceStyle: "dark",
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
      },
    },
  },
  android: {
    package: "com.yaredow.glimpse",
    adaptiveIcon: {
      backgroundColor: tokens.background,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 220,
        resizeMode: "contain",
        backgroundColor: tokens.background,
        dark: {
          image: "./assets/images/splash-icon.png",
          backgroundColor: tokens.background,
        },
      },
    ],
    "expo-font",
    "expo-secure-store",
    "expo-image",
    "expo-status-bar",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
