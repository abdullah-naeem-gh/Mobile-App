// WelcomeScreen — first-run landing. Beige full-bleed with two floating
// decorative cards, the brand mark up top, and the headline + CTAs anchored
// to the bottom. Layout is responsive (positions derive from useResponsive)
// and safe-area aware; no hardcoded 390-based offsets.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { Button, Wordmark } from '../components/ui';
import { colors, spacing, radius, fontFamily, fontSize, shadows } from '../theme';
import { useResponsive } from '../hooks/useResponsive';

interface WelcomeScreenProps {
  navigation: { navigate: (screen: 'Login' | 'SignUp') => void };
}

// Rendered height of the brand mark; also used to derive its floating-card
// clearance so it stays in sync if the size ever changes.
const LOGO_HEIGHT = 72;

// A single decorative placeholder card that drifts gently up and down.
const FloatingCard: React.FC<{
  style: object;
  delay: number;
  rotate: string;
}> = ({ style, delay, rotate }) => {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 3000,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, delay]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.floatingCard, style, { transform: [{ rotate }, { translateY }] }]}
    />
  );
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { width, height } = useResponsive();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 600,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const contentTranslate = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Decorative floating cards */}
        <FloatingCard
          delay={0}
          rotate="-8deg"
          style={{ top: height * 0.14, left: width * 0.06, width: width * 0.42, height: height * 0.26 }}
        />
        <FloatingCard
          delay={1500}
          rotate="10deg"
          style={{ top: height * 0.2, right: width * 0.06, width: width * 0.42, height: height * 0.26 }}
        />

        {/* Brand mark */}
        <View style={styles.logoWrap}>
          <Wordmark size={LOGO_HEIGHT} />
        </View>

        {/* Headline + CTAs, anchored bottom */}
        <Animated.View
          style={[styles.content, { opacity: enter, transform: [{ translateY: contentTranslate }] }]}
        >
          <Text style={styles.title}>Discover Your{'\n'}Perfect Style</Text>
          <Text style={styles.subtitle}>
            Connect with brands, explore outfits, and find articles that match your style
          </Text>
          <View style={styles.ctaGroup}>
            <Button
              label="Get Started"
              onPress={() => navigation.navigate('SignUp')}
              trailing={<Icon name="arrow-forward" size={20} color={colors.onCta} />}
            />
            <Button
              label="I already have an account"
              variant="secondary"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.panel,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingCard: {
    position: 'absolute',
    backgroundColor: colors.fill,
    borderRadius: radius.panel,
    ...shadows.float,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  content: {
    marginTop: 'auto',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    lineHeight: 22,
    color: colors.faded,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  ctaGroup: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
});
