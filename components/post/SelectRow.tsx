// components/post/SelectRow.tsx — a labelled single-select chip row used by
// the composer for category / gender / occasion / currency.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Chip } from '../ui';
import { colors, fontFamily, spacing } from '../../theme';

interface SelectRowProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Capitalize option labels (off for currency codes). */
  capitalize?: boolean;
}

export function SelectRow<T extends string>({
  label,
  options,
  value,
  onChange,
  capitalize = true,
}: SelectRowProps<T>) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((o) => (
          <Chip
            key={o}
            label={capitalize ? o.charAt(0).toUpperCase() + o.slice(1) : o}
            active={value === o}
            onPress={() => onChange(o)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { fontFamily: fontFamily.bold, fontSize: 14, color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
