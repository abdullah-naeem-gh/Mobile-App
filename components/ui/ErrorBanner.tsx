// components/ui/ErrorBanner.tsx — inline error banner (icon + message) used
// under forms (Login / Sign Up / composer). Render only when there is an
// error; returns null for empty messages so call sites can pass state straight
// through.

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { colors, radius, fontFamily, spacing } from '../../theme';

export interface ErrorBannerProps {
  message?: string | null;
  style?: StyleProp<ViewStyle>;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, style }) => {
  if (!message) return null;
  return (
    <View style={[styles.box, style]} accessibilityRole="alert">
      <Icon name="alert-circle-outline" size={20} color={colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorBg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.error,
  },
});
