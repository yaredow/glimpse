import {
  DarkTheme as NavigationDarkTheme,
  type Theme,
} from "@react-navigation/native";
import { themeColors } from "./colors";
import { themeFonts } from "./typography";

export const glimpseNavigationTheme: Theme = {
  ...NavigationDarkTheme,
  dark: true,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: themeColors.primary,
    background: themeColors.background,
    card: themeColors.surface,
    text: themeColors.onSurface,
    border: themeColors.outlineVariant,
    notification: themeColors.primary,
  },
  fonts: {
    ...NavigationDarkTheme.fonts,
    regular: { ...NavigationDarkTheme.fonts.regular, fontFamily: themeFonts.default.fontFamily },
    medium: { ...NavigationDarkTheme.fonts.medium, fontFamily: themeFonts.bodyMedium.fontFamily },
    bold: { ...NavigationDarkTheme.fonts.bold, fontFamily: themeFonts.titleMedium.fontFamily },
    heavy: { ...NavigationDarkTheme.fonts.heavy, fontFamily: themeFonts.headlineMedium.fontFamily },
  },
};
