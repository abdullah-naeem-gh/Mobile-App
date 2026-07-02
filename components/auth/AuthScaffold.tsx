// components/auth/AuthScaffold.tsx — shared chrome for the Sign In / Sign Up
// screens: a beige top panel, the wordmark, and a white rounded card that
// holds the form. Handles the keyboard and scrolling so each screen only has
// to supply its fields. Safe-area aware; no hardcoded status-bar offsets.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '../ui';
import { colors, spacing, radius, fontFamily, shadows } from '../../theme';

export interface AuthScaffoldProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Rendered at the bottom of the card (e.g. the "Sign up" switch link). */
  footer?: React.ReactNode;
}

export const AuthScaffold: React.FC<AuthScaffoldProps> = ({
  title,
  subtitle,
  children,
  footer,
}) => {
  const insets = useSafeAreaInsets();
  const panelHeight = insets.top + 200;

  return (
    <View style={styles.container}>
      {/* Beige panel behind the top of the screen */}
      <View style={[styles.panel, { height: panelHeight }]} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoWrap}>
              <Wordmark size={30} />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              <View style={styles.body}>{children}</View>
              {footer}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.panel,
    borderBottomLeftRadius: radius.hero,
    borderBottomRightRadius: radius.hero,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  logoWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    padding: spacing.xxl,
    gap: spacing.lg,
    ...shadows.float,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: -spacing.sm,
  },
  body: {
    gap: spacing.lg,
  },
});
