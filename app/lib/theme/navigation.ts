import {
  DarkTheme as NavigationDarkTheme,
  type Theme,
} from "@react-navigation/native";
import { colors } from "./tokens.generated";
import { themeFonts } from "./typography";

export const glimpseNavigationTheme: Theme = {
  ...NavigationDarkTheme,
  dark: true,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: colors.primary,
    background: colors.surface1,
    card: colors.surface2,
    text: colors.offWhite,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    ...NavigationDarkTheme.fonts,
    regular: { ...NavigationDarkTheme.fonts.regular, fontFamily: themeFonts.default.fontFamily },
    medium: { ...NavigationDarkTheme.fonts.medium, fontFamily: themeFonts.bodyMedium.fontFamily },
    bold: { ...NavigationDarkTheme.fonts.bold, fontFamily: themeFonts.titleMedium.fontFamily },
    heavy: { ...NavigationDarkTheme.fonts.heavy, fontFamily: themeFonts.headlineMedium.fontFamily },
  },
};
