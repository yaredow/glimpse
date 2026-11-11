import { MD3DarkTheme } from "react-native-paper";

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
} as const;

export const typeClasses = {
  default: "font-brand",
  labelSmall: "font-brandMedium text-[11px] leading-4 tracking-[0.5px] font-medium",
  labelLarge: "font-brandMedium text-[14px] leading-5 tracking-[0.1px] font-medium",
  bodySmall: "font-brand text-[12px] leading-4 tracking-[0.4px]",
  bodyMedium: "font-brand text-[14px] leading-5 tracking-[0.25px]",
  titleMedium: "font-brandSemiBold text-[16px] leading-6 tracking-[0.15px] font-medium",
  headlineMedium: "font-brandBold text-[28px] leading-9 tracking-normal",
  displayLarge: "font-brandExtraBold text-[57px] leading-[64px] tracking-normal",
} as const;

export const themeFonts = {
  ...MD3DarkTheme.fonts,
  displayLarge: {
    ...MD3DarkTheme.fonts.displayLarge,
    fontFamily: fonts.extraBold,
  },
  displayMedium: {
    ...MD3DarkTheme.fonts.displayMedium,
    fontFamily: fonts.bold,
  },
  displaySmall: {
    ...MD3DarkTheme.fonts.displaySmall,
    fontFamily: fonts.bold,
  },
  headlineLarge: {
    ...MD3DarkTheme.fonts.headlineLarge,
    fontFamily: fonts.bold,
  },
  headlineMedium: {
    ...MD3DarkTheme.fonts.headlineMedium,
    fontFamily: fonts.bold,
  },
  headlineSmall: {
    ...MD3DarkTheme.fonts.headlineSmall,
    fontFamily: fonts.semiBold,
  },
  titleLarge: {
    ...MD3DarkTheme.fonts.titleLarge,
    fontFamily: fonts.bold,
  },
  titleMedium: {
    ...MD3DarkTheme.fonts.titleMedium,
    fontFamily: fonts.semiBold,
  },
  titleSmall: {
    ...MD3DarkTheme.fonts.titleSmall,
    fontFamily: fonts.semiBold,
  },
  labelLarge: {
    ...MD3DarkTheme.fonts.labelLarge,
    fontFamily: fonts.semiBold,
  },
  labelMedium: {
    ...MD3DarkTheme.fonts.labelMedium,
    fontFamily: fonts.medium,
  },
  labelSmall: {
    ...MD3DarkTheme.fonts.labelSmall,
    fontFamily: fonts.medium,
  },
  bodyLarge: {
    ...MD3DarkTheme.fonts.bodyLarge,
    fontFamily: fonts.regular,
  },
  bodyMedium: {
    ...MD3DarkTheme.fonts.bodyMedium,
    fontFamily: fonts.regular,
  },
  bodySmall: {
    ...MD3DarkTheme.fonts.bodySmall,
    fontFamily: fonts.regular,
  },
  default: {
    ...MD3DarkTheme.fonts.default,
    fontFamily: fonts.regular,
  },
};
