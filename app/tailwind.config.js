/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
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
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        "surface-obsidian": "hsl(var(--surface-obsidian))",
        "surface-charcoal": "hsl(var(--surface-charcoal))",
        "surface-zinc-900": "hsl(var(--surface-zinc-900))",
        "surface-zinc-850": "hsl(var(--surface-zinc-850))",
        "surface-zinc-800": "hsl(var(--surface-zinc-800))",
        "surface-zinc-750": "hsl(var(--surface-zinc-750))",
        "surface-zinc-700": "hsl(var(--surface-zinc-700))",
        "surface-brand": "hsl(var(--surface-brand))",
        "surface-danger": "hsl(var(--surface-danger))",
        "off-white": "hsl(var(--off-white))",
        "error-container": "hsl(var(--error-container))",
      },
      fontFamily: {
        brand: ["PlusJakartaSans_400Regular"],
        brandMedium: ["PlusJakartaSans_500Medium"],
        brandSemiBold: ["PlusJakartaSans_600SemiBold"],
        brandBold: ["PlusJakartaSans_700Bold"],
        brandExtraBold: ["PlusJakartaSans_800ExtraBold"],
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
