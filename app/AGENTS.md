# Glimpse — Agent Guide

## Quick start
```bash
bun install
bun start        # Expo dev server
bun run android  # Android emulator
bun run ios      # iOS simulator
bun run web      # Web
bun run lint     # ESLint flat config (eslint.config.js)
```

**No tests, no typecheck, no formatter, no CI, no pre-commit hooks.** Install from scratch if needed.

## Stack
- **Expo SDK 55** (React Native 0.83, New Architecture, React Compiler experiment on)
- **Expo Router** (file-based, `app/` directory)
- **Zustand** — auth state only
- **TanStack React Query** — server state, provider at `lib/query-provider.tsx`
- **TanStack React Form** (uses JSX `<form.Field>` render-prop pattern)
- **React Native Paper 5** (MD3 dark theme, see `lib/colors.ts`)
- **ky** — HTTP client with JWT refresh interceptor in `lib/api.ts`
- **Zod** — validation schemas per feature

## Imports
`@/` maps to project root (`tsconfig.json`, `babel.config.js`, `metro.config.js`).
```ts
import { api } from '@/lib/api';
```

## Architecture
- **Feature-sliced modules** under `features/{auth,movies}/` — each has components/, hooks/, services/, schemas/, types/
- **API base URL**: `EXPO_PUBLIC_API_URL` from `.env` (defaults to `http://10.0.2.2:4000` for Android emulator)
- **Auth flow**: token pair in `expo-secure-store`, auto-refresh via JWT decode in `getValidAccessToken()` (60s buffer)
- **Auth guard**: Expo Router `(auth)` / `(app)` route groups with `Stack.Protected` pattern
- **Real docs**: `GLIMPSE.md` (product brief + API). `README.md` is generic Expo template.

## Gotchas
- `features/movies/consants/` is misspelled (should be `constants/`)
- Only `Inter_900Black` font weight loaded
- `.env` has Android emulator loopback URL — adjust for iOS/physical device
- `expo-env.d.ts` is auto-generated (gitignored)
