// components/ui/Wordmark.tsx — the "Kaprayy" brand wordmark. Rendered from the
// minimal logo.png asset (hanger + shirt + "KAPRAYY" lettering) so it keeps the
// aesthetic treatment rather than plain bold text. `size` is the target height;
// width is derived from the asset's aspect ratio.

import React from 'react';
import { Image, StyleProp, ImageStyle } from 'react-native';

// assets/logo.png is 1364 x 448.
const LOGO_ASPECT = 1364 / 448;

export interface WordmarkProps {
  /** Rendered height of the logo in px. */
  size?: number;
  /** Retained for API compatibility; the logo is a multi-colour asset so this is ignored. */
  color?: string;
  style?: StyleProp<ImageStyle>;
}

export const Wordmark: React.FC<WordmarkProps> = ({ size = 28, style }) => (
  <Image
    accessibilityRole="image"
    accessibilityLabel="Kaprayy"
    source={require('../../assets/logo.png')}
    resizeMode="contain"
    style={[{ height: size, width: size * LOGO_ASPECT }, style]}
  />
);
