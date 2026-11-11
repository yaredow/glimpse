import { createContext, useContext } from "react";
import { themeColors } from "./colors";
import { themeFonts } from "./typography";

export const glimpseDarkTheme = {
  dark: true,
  roundness: 4,
  colors: themeColors,
  fonts: themeFonts,
  animation: { scale: 1 },
};

export type AppTheme = typeof glimpseDarkTheme;

export const AppThemeContext = createContext<AppTheme>(glimpseDarkTheme);

export const useAppTheme = () => useContext(AppThemeContext);

export * from "./colors";
export * from "./typography";
export * from "./navigation";
export * from "./toast-config";
