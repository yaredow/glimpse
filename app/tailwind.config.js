/** @type {import('tailwindcss').Config} */
const fontFamilies = require("./lib/theme/fonts.json");

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        hairline: "hsl(var(--hairline))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "subtle-foreground": "hsl(var(--subtle-foreground))",
        "faint-foreground": "hsl(var(--faint-foreground))",
        "surface-1": "hsl(var(--surface-1))",
        "surface-2": "hsl(var(--surface-2))",
        "surface-3": "hsl(var(--surface-3))",
        "surface-4": "hsl(var(--surface-4))",
        "surface-5": "hsl(var(--surface-5))",
        "surface-6": "hsl(var(--surface-6))",
        "surface-7": "hsl(var(--surface-7))",
        "surface-8": "hsl(var(--surface-8))",
        "brand-surface": "hsl(var(--brand-surface))",
        "danger-surface": "hsl(var(--danger-surface))",
        "off-white": "hsl(var(--off-white))",
        white: "hsl(var(--white))",
        gold: "hsl(var(--gold))",
        success: "hsl(var(--success))",
        "success-container": "hsl(var(--success-container))",
        "error-container": "hsl(var(--error-container))",
        "error-container-foreground": "hsl(var(--error-container-foreground))",
      },
      fontFamily: {
        brand: [fontFamilies.regular],
        brandMedium: [fontFamilies.medium],
        brandSemiBold: [fontFamilies.semiBold],
        brandBold: [fontFamilies.bold],
        brandExtraBold: [fontFamilies.extraBold],
      },
      fontSize: {
        "label-sm": ["11px", { lineHeight: "16px", letterSpacing: "0.5px" }],
        label: ["14px", { lineHeight: "20px", letterSpacing: "0.1px" }],
        "body-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.4px" }],
        body: ["14px", { lineHeight: "20px", letterSpacing: "0.25px" }],
        "body-lg": ["16px", { lineHeight: "24px", letterSpacing: "0.5px" }],
        title: ["16px", { lineHeight: "24px", letterSpacing: "0.15px" }],
        "title-lg": ["22px", { lineHeight: "28px", letterSpacing: "0" }],
        headline: ["28px", { lineHeight: "36px", letterSpacing: "0" }],
        display: ["57px", { lineHeight: "64px", letterSpacing: "0" }],
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 2px)",
        "2xl": "calc(var(--radius) + 4px)",
      },
    },
  },
  plugins: [],
};
