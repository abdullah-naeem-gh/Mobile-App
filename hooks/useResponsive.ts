// hooks/useResponsive.ts — responsive sizing that reacts to rotation and
// device size. Replaces the module-load `Dimensions.get('window')` pattern
// scattered across the app (which is captured once and never updates).
//
// The design was authored at 390 × 844 (iPhone 13/14). `scale()` maps a
// design-space pixel value onto the current viewport width, clamped so it
// never balloons on tablets or collapses on tiny phones. Prefer flex/%/
// theme spacing for layout; reach for scale() only for genuinely
// size-relative values (hero heights, avatar sizes, etc.).

import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

export interface Responsive {
  width: number;
  height: number;
  isSmall: boolean; // narrow phones (< 360dp)
  isLarge: boolean; // tablets / large phones (>= 600dp)
  /** Scale a design-space (390-wide) value to the current width. */
  scale: (designPx: number) => number;
  /** Clamp a value between a min and max. */
  clamp: (value: number, min: number, max: number) => number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

  const scale = (designPx: number): number => {
    const factor = clamp(width / BASE_WIDTH, 0.85, 1.25);
    return Math.round(designPx * factor);
  };

  return {
    width,
    height,
    isSmall: width < 360,
    isLarge: width >= 600,
    scale,
    clamp,
  };
}

export { BASE_WIDTH, BASE_HEIGHT };
