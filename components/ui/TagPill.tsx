// components/ui/TagPill.tsx — small sand-colored tag pill.

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors, radius, fontFamily } from '../../theme';

export interface TagPillProps {
  label: string;
}

export const TagPill: React.FC<TagPillProps> = ({ label }) => (
  <View style={styles.pill}>
    <Text style={styles.text} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.tag,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fontFamily.light,
    fontSize: 12,
    color: colors.ink,
  },
});
