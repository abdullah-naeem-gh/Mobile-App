// components/ui/Wordmark.tsx — the "Kaprayy" brand wordmark. Rendered as
// styled text so it scales crisply and needs no image asset. Swap for an
// <Image> here later if a vector/PNG wordmark is added to assets/.

import React from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { colors, fontFamily } from '../../theme';

export interface WordmarkProps {
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Wordmark: React.FC<WordmarkProps> = ({
  size = 28,
  color = colors.ink,
  style,
}) => (
  <Text
    accessibilityRole="header"
    style={[styles.mark, { fontSize: size, color }, style]}
  >
    Kaprayy
  </Text>
);

const styles = StyleSheet.create({
  mark: {
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
  },
});
