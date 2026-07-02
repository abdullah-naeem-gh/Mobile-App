// components/ui/SubHeader.tsx — a lightweight page header (optional back
// button + title + optional trailing element). Owns its top safe-area inset.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { PressableScale } from './Pressable';
import { colors, fontFamily, spacing } from '../../theme';

export interface SubHeaderProps {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  /** Center the title (used on screens without a back button, e.g. Edit Profile). */
  centered?: boolean;
}

export const SubHeader: React.FC<SubHeaderProps> = ({
  title,
  onBack,
  trailing,
  centered = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      {onBack ? (
        <PressableScale
          onPress={onBack}
          activeScale={0.9}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="chevron-back" size={20} color={colors.ink} />
        </PressableScale>
      ) : (
        centered && <View style={styles.backBtn} />
      )}
      <Text style={[styles.title, centered && styles.titleCentered]} numberOfLines={1}>
        {title}
      </Text>
      {trailing ?? (centered ? <View style={styles.backBtn} /> : null)}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.ink,
  },
  titleCentered: {
    textAlign: 'center',
  },
});
