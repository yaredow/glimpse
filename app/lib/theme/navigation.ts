import { adaptNavigationTheme } from "react-native-paper";
import { DarkTheme as NavigationDarkTheme, type Theme } from "@react-navigation/native";
import { themeColors } from "./colors";

const { DarkTheme: adaptedDarkTheme } = adaptNavigationTheme({
  reactNavigationDark: NavigationDarkTheme,
});

export const glimpseNavigationTheme: Theme = {
  ...NavigationDarkTheme,
  ...adaptedDarkTheme,
  dark: true,
  colors: {
    ...adaptedDarkTheme.colors,
    primary: themeColors.primary,
    background: themeColors.background,
    card: themeColors.surface,
    text: themeColors.onSurface,
    border: themeColors.outlineVariant,
    notification: themeColors.primary,
  },
  fonts: NavigationDarkTheme.fonts,
};
