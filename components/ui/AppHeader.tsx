// components/ui/AppHeader.tsx — top bar for the feeds: wordmark + filter
// button. Owns its own top safe-area inset so screens never hardcode a
// status-bar offset.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { Wordmark } from './Wordmark';
import { PressableScale } from './Pressable';
import { colors, radius, spacing } from '../../theme';

export interface AppHeaderProps {
  onFilter?: () => void;
  hasFilters?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onFilter, hasFilters = false }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Wordmark size={26} />
      {onFilter ? (
        <PressableScale
          onPress={onFilter}
          activeScale={0.9}
          style={[styles.filterBtn, hasFilters && styles.filterBtnActive]}
          accessibilityRole="button"
          accessibilityLabel="Filters"
        >
          <Icon
            name="options-outline"
            size={22}
            color={hasFilters ? colors.onDark : colors.ink}
          />
        </PressableScale>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.ink,
  },
});
