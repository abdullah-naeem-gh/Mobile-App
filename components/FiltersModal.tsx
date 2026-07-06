// FiltersModal — article filters as a bottom sheet. Re-skinned to the design
// (drag handle, sectioned chips, amber Apply) while preserving all filter
// logic: search, gender, category, colors, sizes, and the DB-backed price
// slider. Emits the same ArticleFilters shape HomeScreen expects.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { CategoryType, GenderType } from '../types';
import { ArticleFilters, articleService } from '../services/articleService';
import { Chip, Input, Section } from './ui';
import { colors, radius, spacing, fontFamily, shadows } from '../theme';

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ArticleFilters) => void;
  currentFilters: ArticleFilters;
}

const CATEGORY_OPTIONS: CategoryType[] = [
  'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags',
];
const GENDER_OPTIONS: GenderType[] = ['male', 'female', 'unisex'];
const COLOR_OPTIONS = [
  'black', 'white', 'gray', 'navy', 'blue', 'red', 'pink', 'green',
  'yellow', 'orange', 'purple', 'brown', 'beige', 'cream', 'gold', 'silver',
];
const SIZE_OPTIONS = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '28', '30', '32', '34', '36', '38', '40', '42', '44', '46',
  '6', '7', '8', '9', '10', '11', '12',
];

// Approximate swatch colors for the color chips.
const SWATCH: Record<string, string> = {
  black: '#000000', white: '#FFFFFF', gray: '#9E9E9E', navy: '#1F2A44',
  blue: '#3B6BE6', red: '#D64B4B', pink: '#E8A0B4', green: '#5B8C4A',
  yellow: '#E8C653', orange: '#E08A3C', purple: '#7A5AA8', brown: '#8A5A3C',
  beige: '#E8D5C4', cream: '#FFF8F0', gold: '#C9A24B', silver: '#C7C7CC',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const FiltersModal: React.FC<FiltersModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState(currentFilters.search || '');
  const [selectedGender, setSelectedGender] = useState<GenderType | undefined>(currentFilters.gender);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | undefined>(currentFilters.category);
  const [selectedColors, setSelectedColors] = useState<string[]>(currentFilters.colors || []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(currentFilters.sizes || []);
  const [priceRange, setPriceRange] = useState({
    min: currentFilters.priceRange?.min || 0,
    max: currentFilters.priceRange?.max || 100000,
  });
  const [dbPriceRange, setDbPriceRange] = useState({ min: 0, max: 100000 });
  const [priceRangeLoaded, setPriceRangeLoaded] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSearchQuery(currentFilters.search || '');
    setSelectedGender(currentFilters.gender);
    setSelectedCategory(currentFilters.category);
    setSelectedColors(currentFilters.colors || []);
    setSelectedSizes(currentFilters.sizes || []);
    if (!priceRangeLoaded) loadPriceRange();
    if (currentFilters.priceRange) setPriceRange(currentFilters.priceRange);
    else if (priceRangeLoaded) setPriceRange(dbPriceRange);
  }, [visible, currentFilters, priceRangeLoaded, dbPriceRange]);

  const loadPriceRange = async () => {
    const result = await articleService.getPriceRange();
    const range = result.success && result.data ? result.data : { min: 0, max: 100000 };
    setDbPriceRange(range);
    if (!currentFilters.priceRange) setPriceRange(range);
    setPriceRangeLoaded(true);
  };

  const toggle = (list: string[], value: string): string[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const priceActive = priceRange.min !== dbPriceRange.min || priceRange.max !== dbPriceRange.max;

  const handleApply = () => {
    onApplyFilters({
      search: searchQuery.trim() || undefined,
      gender: selectedGender,
      category: selectedCategory,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
      priceRange: priceActive ? priceRange : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedGender(undefined);
    setSelectedCategory(undefined);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange(dbPriceRange);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Filters</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Input
                placeholder="Search articles, brands…"
                value={searchQuery}
                onChangeText={setSearchQuery}
                trailing={<Ionicons name="search" size={18} color={colors.muted} />}
                containerStyle={styles.search}
              />

              <Section title="Gender">
                <View style={styles.chipRow}>
                  {GENDER_OPTIONS.map((g) => (
                    <Chip
                      key={g}
                      label={cap(g)}
                      active={selectedGender === g}
                      onPress={() => setSelectedGender(selectedGender === g ? undefined : g)}
                    />
                  ))}
                </View>
              </Section>

              <Section title="Category">
                <View style={styles.chipRow}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <Chip
                      key={c}
                      label={cap(c)}
                      active={selectedCategory === c}
                      onPress={() => setSelectedCategory(selectedCategory === c ? undefined : c)}
                    />
                  ))}
                </View>
              </Section>

              <Section title="Colors">
                <View style={styles.chipRow}>
                  {COLOR_OPTIONS.map((c) => {
                    const active = selectedColors.includes(c);
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setSelectedColors((prev) => toggle(prev, c))}
                        style={[styles.colorChip, active && styles.colorChipActive]}
                      >
                        <View style={[styles.swatch, { backgroundColor: SWATCH[c] ?? colors.fill }]} />
                        <Text style={styles.colorChipText}>{cap(c)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Section>

              <Section title="Sizes">
                <View style={styles.chipRow}>
                  {SIZE_OPTIONS.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      active={selectedSizes.includes(s)}
                      onPress={() => setSelectedSizes((prev) => toggle(prev, s))}
                    />
                  ))}
                </View>
              </Section>

              <Section title="Price range">
                <View style={styles.priceLabels}>
                  <Text style={styles.priceValue}>PKR {priceRange.min.toLocaleString()}</Text>
                  <Text style={styles.priceValue}>PKR {priceRange.max.toLocaleString()}</Text>
                </View>
                <Text style={styles.sliderLabel}>Minimum</Text>
                <Slider
                  minimumValue={dbPriceRange.min}
                  maximumValue={priceRange.max}
                  value={priceRange.min}
                  onValueChange={(v) => setPriceRange((p) => ({ ...p, min: Math.round(v) }))}
                  minimumTrackTintColor={colors.ink}
                  maximumTrackTintColor={colors.line}
                  thumbTintColor={colors.ink}
                />
                <Text style={styles.sliderLabel}>Maximum</Text>
                <Slider
                  minimumValue={priceRange.min}
                  maximumValue={dbPriceRange.max}
                  value={priceRange.max}
                  onValueChange={(v) => setPriceRange((p) => ({ ...p, max: Math.round(v) }))}
                  minimumTrackTintColor={colors.ink}
                  maximumTrackTintColor={colors.line}
                  thumbTintColor={colors.ink}
                />
              </Section>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
              <Pressable style={[styles.footerBtn, styles.resetBtn]} onPress={handleReset}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
              <Pressable style={[styles.footerBtn, styles.applyBtn]} onPress={handleApply}>
                <Text style={styles.applyText}>Apply filters</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '88%',
    ...shadows.float,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.ink,
  },
  search: {
    marginBottom: spacing.xl,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s10,
    paddingLeft: spacing.xs,
    backgroundColor: colors.input,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipActive: {
    borderColor: colors.ink,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
  },
  colorChipText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.ink,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceValue: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.ink,
  },
  sliderLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  footerBtn: {
    height: 56,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    flex: 1,
    backgroundColor: colors.input,
  },
  applyBtn: {
    flex: 2,
    backgroundColor: colors.cta,
  },
  resetText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.ink,
  },
  applyText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.onCta,
  },
});
