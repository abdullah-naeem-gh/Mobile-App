// components/ui/StatTile.tsx — a single profile stat (value + label).

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors, radius, fontFamily } from '../../theme';

export interface StatTileProps {
  value: string | number;
  label: string;
}

export const StatTile: React.FC<StatTileProps> = ({ value, label }) => (
  <View style={styles.tile}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: radius.input,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.ink,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.ink,
  },
});
