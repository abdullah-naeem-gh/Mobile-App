// components/ui/Button.tsx — the app's button family.
//   variant="primary"   → full-width amber CTA, 60 tall, bold 20 (Get Started, Sign In)
//   variant="secondary" → full-width cream, 60 tall, regular 16 (I already have an account)
//   variant="inline"    → compact amber pill, 42 tall (Visit, Show Articles)
// Black text on amber, always. Disabled dims the fill and blocks presses.

import React from 'react';
import { Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { PressableScale } from './Pressable';
import { colors, radius, fontFamily, spacing } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'inline';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Optional icon rendered to the right of the label. */
  trailing?: React.ReactNode;
  /** Optional icon rendered to the left of the label. */
  leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  trailing,
  leading,
  style,
  textStyle,
}) => {
  const isInline = variant === 'inline';
  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    isInline && styles.inline,
    disabled && styles.disabled,
    style,
  ];
  const labelStyle = [
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    isInline && styles.inlineText,
    textStyle,
  ];

  return (
    <PressableScale
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.onCta} />
      ) : (
        <>
          {leading}
          <Text style={labelStyle} numberOfLines={1}>
            {label}
          </Text>
          {trailing}
        </>
      )}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s10,
  },
  primary: {
    backgroundColor: colors.ctaSoft,
    borderRadius: radius.input,
    height: 60,
    width: '100%',
    paddingHorizontal: spacing.xxl,
  },
  secondary: {
    backgroundColor: colors.secondaryBtn,
    borderRadius: radius.input,
    height: 60,
    width: '100%',
    paddingHorizontal: spacing.xxl,
  },
  inline: {
    backgroundColor: colors.cta,
    borderRadius: radius.round,
    height: 42,
    paddingHorizontal: spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.onCta,
  },
  secondaryText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.ink,
  },
  inlineText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.onCta,
  },
});
