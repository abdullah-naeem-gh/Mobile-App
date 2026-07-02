// theme/spacing.ts — 4px-base spacing scale + corner radii.
// Use these instead of magic pixel numbers so layout stays consistent.

export const spacing = {
  xs: 4,
  sm: 8,
  s10: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  x40: 40,
  x64: 64,
} as const;

export const radius = {
  card: 10,
  pill: 14,
  input: 15, // input, primary button, role chip
  panel: 20, // hero panel, inline CTA, sheet
  hero: 43, // big cream panel behind header
  round: 999,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
