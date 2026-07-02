// theme/index.ts — barrel export for the Kaprayy design system.
// Import from here: `import { theme } from '../theme';` or pull named tokens.

import { colors, palette } from './colors';
import { spacing, radius } from './spacing';
import { typography, fontFamily, fontSize } from './typography';
import { shadows } from './shadows';

export const theme = {
  colors,
  palette,
  spacing,
  radius,
  typography,
  fontFamily,
  fontSize,
  shadows,
} as const;

export { colors, palette } from './colors';
export { spacing, radius } from './spacing';
export { typography, fontFamily, fontSize } from './typography';
export { shadows } from './shadows';

export type { ThemeColors, Palette } from './colors';
export type { Spacing, Radius } from './spacing';
export type { Typography } from './typography';
export type { Shadows } from './shadows';

export type Theme = typeof theme;
