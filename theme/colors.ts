// theme/colors.ts — Kaprayy semantic color tokens.
// Single source of truth for every color in the app. Derived from the
// design system (colors_and_type.css). Where the codebase and Figma
// disagreed on a hex, the codebase (shipping) value is canonical.

export const palette = {
  // Warm sand — the cream beige used for panels/backgrounds
  sand50: '#FFF8F8',
  sand100: '#F5F3F3',
  sand200: '#E8D5C4', // primary beige panel (canonical)
  sand300: '#E7CDB5', // tag / avatar border

  // Amber tan — warm CTA color (black text on top, never white)
  amber: '#E6A66B',
  amberSoft: 'rgba(230,166,107,0.77)',
  amberDark: '#E6CCB4',

  // Ink — black system
  ink: '#000000',
  ink900: '#1D1B20', // bookmark icon
  ink800: '#262626', // dark-mode card fill
  ink700: '#1E1E1E', // selected chip fill

  // Neutrals
  white: '#FFFFFF',
  muted: '#6C6C6C', // secondary text
  line200: '#E5E5E5', // dividers, idle borders
  line300: '#D5D5D5',
  fill100: '#F3F3F3', // idle chip fill
  fill200: '#F2F2F2',
  fill300: '#E8E8E8',
  fill400: '#D9D9D9', // avatar placeholder

  // State (never used for branding)
  heart: '#FF3040', // like / active
  error: '#D64B4B',
  success: '#4CAF50',

  // Translucent
  overlayFade: 'rgba(0,0,0,0.61)', // welcome subtitle
  overlayMute: 'rgba(0,0,0,0.75)',
  scrim: 'rgba(0,0,0,0.4)', // modal backdrop
} as const;

// Semantic tokens — screens should reference these, not raw palette entries.
export const colors = {
  // Backgrounds / surfaces
  bg: palette.white,
  panel: palette.sand200, // big rounded cream panel behind headers
  surface: palette.white, // white card on top of a panel
  surfaceDark: palette.ink800, // dark-mode card
  input: palette.sand100,
  tag: palette.sand300,
  fill: palette.fill100, // idle chip / neutral fill

  // CTA
  cta: palette.amber,
  ctaSoft: palette.amberSoft,
  ctaDark: palette.amberDark,
  secondaryBtn: palette.sand50,

  // Foreground / text
  ink: palette.ink,
  fg: palette.ink,
  muted: palette.muted,
  faded: palette.overlayFade,
  onCta: palette.ink, // black-on-amber — never white
  onDark: palette.white,
  onPhoto: palette.white,

  // Lines / borders / avatars
  line: palette.line200,
  lineStrong: palette.line300,
  avatarBg: palette.fill400,
  avatarBorder: palette.sand300,

  // State
  heart: palette.heart,
  error: palette.error,
  success: palette.success,

  // Overlays
  scrim: palette.scrim,
  overlayMute: palette.overlayMute,
} as const;

export type Palette = typeof palette;
export type ThemeColors = typeof colors;
