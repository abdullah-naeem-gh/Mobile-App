// components/ui/Chip.tsx — selectable filter chip + a horizontal ChipRow.
// Active chip fills black with white text.

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { PressableScale } from './Pressable';
import { colors, radius, fontFamily, spacing } from '../../theme';

export interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export const Chip: React.FC<ChipProps> = ({ label, active, onPress }) => (
  <PressableScale
    onPress={onPress}
    activeScale={0.96}
    style={[styles.chip, active ? styles.active : styles.idle]}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
  >
    <Text style={[styles.text, { color: active ? colors.onDark : colors.ink }]}>
      {label}
    </Text>
  </PressableScale>
);

export interface ChipRowProps {
  options: string[];
  value: string;
  onChange: (option: string) => void;
}

export const ChipRow: React.FC<ChipRowProps> = ({ options, value, onChange }) => (
  <View style={styles.row}>
    {options.map((o) => {
      const active =
        value.toLowerCase() === o.toLowerCase() || (!value && o === 'Any');
      return <Chip key={o} label={o} active={active} onPress={() => onChange(o)} />;
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  idle: { backgroundColor: colors.input },
  active: { backgroundColor: colors.ink },
  text: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
});
