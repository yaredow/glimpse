export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
} as const;

export const typeClasses = {
  default: "font-brand",
  labelSmall: "font-brandMedium text-[11px] leading-4 tracking-[0.5px]",
  labelLarge: "font-brandMedium text-[14px] leading-5 tracking-[0.1px]",
  bodySmall: "font-brand text-[12px] leading-4 tracking-[0.4px]",
  bodyMedium: "font-brand text-[14px] leading-5 tracking-[0.25px]",
  titleMedium: "font-brandSemiBold text-[16px] leading-6 tracking-[0.15px]",
  headlineMedium: "font-brandBold text-[28px] leading-9 tracking-normal",
  displayLarge: "font-brandExtraBold text-[57px] leading-[64px] tracking-normal",
} as const;

type FontVariant = {
  fontFamily: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
};

const variant = (
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing: number,
): FontVariant => ({ fontFamily, fontSize, lineHeight, letterSpacing });

export const themeFonts = {
  displayLarge: variant(fonts.extraBold, 57, 64, 0),
  displayMedium: variant(fonts.bold, 45, 52, 0),
  displaySmall: variant(fonts.bold, 36, 44, 0),
  headlineLarge: variant(fonts.bold, 32, 40, 0),
  headlineMedium: variant(fonts.bold, 28, 36, 0),
  headlineSmall: variant(fonts.semiBold, 24, 32, 0),
  titleLarge: variant(fonts.bold, 22, 28, 0),
  titleMedium: variant(fonts.semiBold, 16, 24, 0.15),
  titleSmall: variant(fonts.semiBold, 14, 20, 0.1),
  labelLarge: variant(fonts.semiBold, 14, 20, 0.1),
  labelMedium: variant(fonts.medium, 12, 16, 0.5),
  labelSmall: variant(fonts.medium, 11, 16, 0.5),
  bodyLarge: variant(fonts.regular, 16, 24, 0.5),
  bodyMedium: variant(fonts.regular, 14, 20, 0.25),
  bodySmall: variant(fonts.regular, 12, 16, 0.4),
  default: variant(fonts.regular, 14, 20, 0.25),
} as const;
