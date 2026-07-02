// components/profile/ProfilePostsGrid.tsx — the 3-column posts grid inside a
// soft panel, with loading / error / empty states. Presentational; the screen
// normalizes its data into GridItem[] and owns the handlers.

import React from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { PressableScale } from '../ui';
import { colors, radius, spacing, fontFamily } from '../../theme';

export interface GridItem {
  id: string;
  image?: string | null;
  price?: number;
  currency?: string;
}

export interface ProfilePostsGridProps {
  title: string;
  data: GridItem[];
  loading: boolean;
  error?: string | null;
  emptyLabel: string;
  onRetry: () => void;
  onPressItem: (id: string) => void;
}

export const ProfilePostsGrid: React.FC<ProfilePostsGridProps> = ({
  title,
  data,
  loading,
  error,
  emptyLabel,
  onRetry,
  onPressItem,
}) => {
  const renderItem = ({ item }: { item: GridItem }) => (
    <PressableScale style={styles.item} activeScale={0.97} onPress={() => onPressItem(item.id)}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="image-outline" size={24} color={colors.muted} />
        </View>
      )}
      {item.price ? (
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>
            {item.currency || 'PKR'} {item.price}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.muted} />
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Icon name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.stateText}>{error}</Text>
          <PressableScale style={styles.retry} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </PressableScale>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.state}>
          <Icon name="shirt-outline" size={40} color={colors.tag} />
          <Text style={styles.stateText}>{emptyLabel}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.fill,
    borderRadius: radius.input,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  grid: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.sm,
  },
  item: {
    flex: 1 / 3,
    aspectRatio: 3 / 4,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  priceText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: '#fff',
  },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.onDark,
  },
});
