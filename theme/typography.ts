// theme/typography.ts — Inter type system.
//
// React Native does not reliably synthesize weights for custom fonts, so
// each weight is its own loaded family (see App.tsx font loading). Always
// pick a family via `fontFamily.*` rather than setting numeric fontWeight
// on a custom font.

import type { TextStyle } from 'react-native';
import { colors } from './colors';

// Family names must match the keys registered with useFonts() in App.tsx.
export const fontFamily = {
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
} as const;

export const fontSize = {
  display: 36, // Welcome H1
  title: 32,
  h1: 20, // "Profile", card title
  h2: 18, // section headers
  h3: 16,
  body: 16,
  meta: 14, // description, helper
  micro: 12, // tags, ALL CAPS labels
} as const;

// Ready-made text presets. Spread into a Text style: style={[typography.h1]}.
export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    letterSpacing: -0.5,
    color: colors.fg,
  } as TextStyle,
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    color: colors.fg,
  } as TextStyle,
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h1,
    color: colors.fg,
  } as TextStyle,
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h2,
    color: colors.fg,
  } as TextStyle,
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h3,
    color: colors.fg,
  } as TextStyle,
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.fg,
  } as TextStyle,
  bodyMuted: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.muted,
  } as TextStyle,
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: colors.fg,
  } as TextStyle,
  metaMuted: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: colors.muted,
  } as TextStyle,
  micro: {
    fontFamily: fontFamily.light,
    fontSize: fontSize.micro,
    color: colors.fg,
  } as TextStyle,
  label: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.meta,
    color: colors.fg,
  } as TextStyle,
} as const;

export type Typography = typeof typography;
