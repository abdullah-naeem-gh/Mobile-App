// StyleQuizScreen — post-signup cold-start for consumers. A mood board of
// style tiles: tap to "love" a few, then continue into the feed. This seeds
// taste before the Reels feed has any swipe signal.
//
// TODO(backend): persist the selected style tags to the user's profile /
// recommendation model. For now it's local state and simply completes
// onboarding.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { Button, PressableScale } from '../components/ui';
import { colors, radius, spacing, fontFamily, palette } from '../theme';

const TILES = [
  'Streetwear', 'Minimalist', 'Workwear',
  'Festive', 'Y2K', 'Linen / Summer',
  'Earth tones', 'Monochrome', 'Layered',
] as const;

// A soft rotating palette so the board reads as a grid of distinct moods.
const TONES = [
  palette.sand200, palette.sand300, palette.fill300,
  palette.amberDark, palette.sand100, palette.fill400,
  palette.sand200, palette.fill300, palette.sand300,
];

const MIN_PICKS = 3;

export const StyleQuizScreen: React.FC = () => {
  const { completeOnboarding } = useAuth();
  const [loved, setLoved] = useState<Set<string>>(new Set());
  const [finishing, setFinishing] = useState(false);

  const toggle = (label: string) => {
    setLoved((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const finish = async () => {
    setFinishing(true);
    await completeOnboarding();
  };

  const progress = Math.min(1, loved.size / MIN_PICKS);
  const enough = loved.size >= MIN_PICKS;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.step}>STEP 2 OF 2</Text>
            <PressableScale onPress={finish} hitSlop={8}>
              <Text style={styles.skip}>Skip</Text>
            </PressableScale>
          </View>
          <Text style={styles.title}>Pick what catches your eye.</Text>
          <Text style={styles.subtitle}>
            Tap to love. We'll use this to shape your feed — you can refine later.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {TILES.map((label, i) => {
            const isLoved = loved.has(label);
            return (
              <PressableScale
                key={label}
                activeScale={0.96}
                onPress={() => toggle(label)}
                style={[
                  styles.tile,
                  { backgroundColor: TONES[i] },
                  isLoved && styles.tileLoved,
                ]}
              >
                <Text style={styles.tileLabel}>{label}</Text>
                {isLoved ? (
                  <View style={styles.heartBadge}>
                    <Icon name="heart" size={13} color={colors.onCta} />
                  </View>
                ) : null}
              </PressableScale>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Button
            label={enough ? 'Show me my feed' : `Pick ${MIN_PICKS - loved.size} more`}
            onPress={finish}
            disabled={!enough}
            loading={finishing}
            trailing={enough ? <Icon name="arrow-forward" size={18} color={colors.onCta} /> : undefined}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  step: { fontFamily: fontFamily.bold, fontSize: 13, letterSpacing: 1, color: colors.muted },
  skip: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.muted },
  title: { fontFamily: fontFamily.bold, fontSize: 26, letterSpacing: -0.4, color: colors.ink, marginTop: spacing.sm },
  subtitle: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, color: colors.muted },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s10,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  tile: {
    width: '31%',
    aspectRatio: 3 / 4,
    borderRadius: radius.pill,
    padding: spacing.s10,
    justifyContent: 'flex-end',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  tileLoved: { borderColor: colors.cta },
  tileLabel: { fontFamily: fontFamily.bold, fontSize: 12, color: colors.ink },
  heartBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.line, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: colors.cta },
});
