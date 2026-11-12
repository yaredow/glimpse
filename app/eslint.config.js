// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tailwindcss = require('eslint-plugin-tailwindcss');

// NativeWind resolves a different Tailwind preset per platform. The native
// preset is what actually ships, so the linter must validate against it too.
process.env.NATIVEWIND_OS = process.env.NATIVEWIND_OS || 'ios';

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    files: ['**/*.tsx', '**/*.ts'],
    plugins: { tailwindcss },
    settings: {
      tailwindcss: {
        cssFiles: ['./global.css'],
        config: require.resolve('./tailwind.config.js'),
        callees: ['cva', 'cn', 'clsx', 'twMerge', 'Platform.select'],
      },
    },
    rules: {
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/no-custom-classname': 'error',
    },
  },
  {
    // All UI text goes through the shared primitive so the type ramp stays in
    // one place. `components/ui/text.tsx` is the only place allowed to touch
    // the React Native primitive.
    files: ['app/**/*.{ts,tsx}', 'features/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    ignores: ['components/ui/text.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text'],
              message: "Import Text from '@/components/ui/text' instead.",
            },
          ],
        },
      ],
    },
  },
]);
