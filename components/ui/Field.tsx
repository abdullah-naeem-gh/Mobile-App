// components/ui/Field.tsx — a labelled input row (bold label over an Input).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input, InputProps } from './Input';
import { colors, fontFamily, spacing } from '../../theme';

export interface FieldProps extends InputProps {
  label: string;
}

export const Field: React.FC<FieldProps> = ({ label, ...inputProps }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Input {...inputProps} />
  </View>
);

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.ink,
  },
});
