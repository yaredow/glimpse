import { createContext, useContext } from "react";
import { MD3DarkTheme } from "react-native-paper";
import { themeColors } from "./colors";
import { themeFonts } from "./typography";

export const glimpseDarkTheme = {
  ...MD3DarkTheme,
  colors: themeColors,
  fonts: themeFonts,
};

export const netflixTheme = glimpseDarkTheme;

export type AppTheme = typeof glimpseDarkTheme;

export const AppThemeContext = createContext<AppTheme>(glimpseDarkTheme);

export const useAppTheme = () => useContext(AppThemeContext);

export * from "./colors";
export * from "./typography";
export * from "./navigation";
export * from "./toast-config";
