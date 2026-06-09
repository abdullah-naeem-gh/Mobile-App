# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kaprayy** — an Expo-based React Native app (fashion discovery platform) supporting two user roles: **consumers** and **brands**. Backend is Supabase (auth, database, storage). No testing infrastructure exists yet.

## Commands

```bash
# Start dev server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

There is no lint, format, or test script configured. TypeScript checking is available via `npx tsc --noEmit`.

## Environment Variables

Copy `.env.example` (if present) or create `.env` with:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

Loaded via `react-native-dotenv` (babel plugin). Types declared in `types/env.d.ts`. The `.env` file is gitignored.

## Architecture

### Entry & Providers

`index.ts` → `App.tsx` wraps the app in `AuthProvider` (from `contexts/AuthContext.tsx`) and `GestureHandlerRootView`, then renders `<AppNavigator />`.

### Auth & Role System

`contexts/AuthContext.tsx` is the single source of truth for auth state. It exposes:
- `session`, `user`, `userRole` (`'consumer' | 'brand'`), `loading`, `isNewUser`
- Methods: `signUp`, `signIn`, `signOut`, `completeOnboarding`

`isNewUser` is determined by checking if the account was created within the last 10 minutes (Supabase `created_at` timestamp comparison).

### Navigation

`navigation/AppNavigator.tsx` renders one of three navigator trees based on auth state:

| State | Navigator | Screens |
|---|---|---|
| Unauthenticated | `AuthStack` | Welcome → Login → SignUp |
| New user | `OnboardingStack` | Onboarding (role-specific forms) |
| Authenticated | `MainTabs` | Articles, Outfits, Post, Profile |

`MainTabs` is a bottom tab navigator. Each tab has its own nested stack (e.g., `HomeStack` contains `HomeScreen` + `FullScreenArticleScreen`).

### Service Layer

All Supabase queries go through `services/`. Each method returns `{ success: boolean, data?: T, error?: string }` — never throws.

- `articleService.ts` — CRUD for articles, likes/saves, filtering (gender, category, brand, price range, colors, sizes)
- `outfitService.ts` — CRUD for outfits, likes/saves; exported as a **singleton** instance. `prepareOutfitData()` adapts payload based on whether the user is a consumer or brand.
- `likesService.ts` — aggregates liked/saved items across both articles and outfits

### Storage & Images

`lib/supabase.ts` — Supabase client (singleton, with AsyncStorage session persistence).

`lib/storage.ts` — Supabase Storage helpers for four buckets: `profile_pics`, `article_images`, `outfit_images`, `wardrobe_images`. Exports image picker functions: `pickImage`, `pickSquareImage`, `pickFullImage`, `takePhoto`.

`lib/imageUtils.ts` — dimension caching with retry logic, cache-busting, and fallback dimensions. Used to avoid layout shift on images with unknown dimensions.

### Forms

React Hook Form + Zod + `@hookform/resolvers/zod`. All form schemas should be defined with Zod and passed through the resolver.

### Custom Hooks

- `useImageUpload()` — image selection + upload with progress state
- `useProfile()` — fetches the current user's profile from Supabase (consumer or brand table)
- `useInAppBrowser()` — controls the `InAppBrowser` component (WebView wrapper)

### Key Types

Defined in `types/index.ts`:
- `GenderType`: `'male' | 'female' | 'unisex'`
- `CategoryType`: `'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories' | 'bags'`
- `Article`, `Brand`, `User`, `Outfit` — primary data models

### Platform Considerations

- Use `PlatformStatusBar` and `AndroidSafeArea` components instead of raw `StatusBar`/`SafeAreaView` for consistent cross-platform behaviour.
- Android uses edge-to-edge mode; safe area insets must be accounted for manually in some screens.
- The app is locked to **portrait** orientation (set in `app.json`).

### UI / Theming

The app uses a beige colour scheme. Shared style values are not yet centralised in a theme file — colours and spacing are often inline. When adding new UI, follow the existing beige palette visible in current screens.

Dual component versions exist for outfits (`OutfitCard.tsx` and `OutfitCard_new.tsx`); prefer the `_new` version for any new work unless the context requires the original.
