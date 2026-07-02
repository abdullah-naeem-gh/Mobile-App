// components/ui/Section.tsx — a labelled block used in the filter sheet and
// composer (bold title over its children).

import React from 'react';
import { Text, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, fontFamily, spacing } from '../../theme';

export interface SectionProps {
  title: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Section: React.FC<SectionProps> = ({ title, children, style }) => (
  <View style={[styles.section, style]}>
    <Text style={styles.title}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.s10,
  },
});
