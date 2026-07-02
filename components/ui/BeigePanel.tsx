// components/ui/BeigePanel.tsx — the big rounded sand surface anchored to
// the top of a screen behind the header. Absolutely positioned; give it a
// height that comfortably covers the header + top inset.

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';

export interface BeigePanelProps {
  height: number;
  style?: StyleProp<ViewStyle>;
}

export const BeigePanel: React.FC<BeigePanelProps> = ({ height, style }) => (
  <View pointerEvents="none" style={[styles.panel, { height }, style]} />
);

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.panel,
    borderRadius: radius.hero,
  },
});
