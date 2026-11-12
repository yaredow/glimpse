import {
  DarkTheme as NavigationDarkTheme,
  type Theme,
} from "@react-navigation/native";
import { colors } from "./tokens.generated";
import fontFamilies from "./fonts.json";

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
    regular: { ...NavigationDarkTheme.fonts.regular, fontFamily: fontFamilies.regular },
    medium: { ...NavigationDarkTheme.fonts.medium, fontFamily: fontFamilies.regular },
    bold: { ...NavigationDarkTheme.fonts.bold, fontFamily: fontFamilies.semiBold },
    heavy: { ...NavigationDarkTheme.fonts.heavy, fontFamily: fontFamilies.bold },
  },
};
