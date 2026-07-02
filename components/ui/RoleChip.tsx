// components/ui/RoleChip.tsx — a selectable role chip (Sign Up). Selected
// state fills black with white text; idle is a neutral fill.

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { PressableScale } from './Pressable';
import { colors, palette, radius, fontFamily } from '../../theme';

export interface RoleChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const RoleChip: React.FC<RoleChipProps> = ({ label, selected, onPress }) => (
  <PressableScale
    onPress={onPress}
    activeScale={0.98}
    style={[styles.chip, selected ? styles.selected : styles.idle]}
    accessibilityRole="button"
    accessibilityState={{ selected }}
  >
    <Text style={[styles.text, selected ? styles.textSelected : styles.textIdle]} numberOfLines={1}>
      {label}
    </Text>
  </PressableScale>
);

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    height: 48,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  idle: { backgroundColor: colors.fill },
  selected: { backgroundColor: palette.ink700 },
  text: { fontFamily: fontFamily.regular, fontSize: 15 },
  textIdle: { color: colors.ink },
  textSelected: { color: colors.onDark },
});
