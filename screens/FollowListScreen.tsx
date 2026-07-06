// FollowListScreen — Followers / Following lists, opened from the Profile
// menu. Rendered inline by ProfileScreen (same onBack pattern as SavedScreen
// and LikesScreen). Rows show avatar, name and subtitle; brand rows can be
// opened via onOpenBrand, and Following rows expose an Unfollow action.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { followService, FollowListEntry } from '../services/followService';
import { SubHeader, PressableScale } from '../components/ui';
import { colors, radius, spacing, fontFamily, fontSize, typography } from '../theme';

interface FollowListScreenProps {
  mode: 'followers' | 'following';
  onBack: () => void;
  /** Open a brand's profile (only used for brand rows in Following). */
  onOpenBrand?: (brandId: string) => void;
}

export const FollowListScreen: React.FC<FollowListScreenProps> = ({
  mode,
  onBack,
  onOpenBrand,
}) => {
  const { user, userRole } = useAuth();
  const [entries, setEntries] = useState<FollowListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const title = mode === 'followers' ? 'Followers' : 'Following';

  const loadEntries = useCallback(async () => {
    if (!user) return;
    const result =
      mode === 'followers'
        ? await followService.getFollowers(user.id, userRole === 'brand' ? 'brand' : 'consumer')
        : await followService.getFollowing(user.id);
    if (result.success && result.data) {
      setEntries(result.data);
    } else {
      Alert.alert('Error', result.error || `Failed to load ${title.toLowerCase()}`);
    }
    setLoading(false);
  }, [user, userRole, mode, title]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const handleUnfollow = (entry: FollowListEntry) => {
    if (!user || entry.kind !== 'brand') return;
    Alert.alert('Unfollow', `Unfollow ${entry.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: async () => {
          const result = await followService.unfollowBrand(user.id, entry.id);
          if (result.success) {
            setEntries((prev) => prev.filter((e) => e.followId !== entry.followId));
          } else {
            Alert.alert('Error', result.error || 'Failed to unfollow');
          }
        },
      },
    ]);
  };

  const renderRow = ({ item }: { item: FollowListEntry }) => {
    const initial = item.name?.charAt(0)?.toUpperCase() ?? '?';
    const openable = item.kind === 'brand' && !!onOpenBrand;
    return (
      <PressableScale
        style={styles.row}
        activeScale={openable ? 0.98 : 1}
        onPress={openable ? () => onOpenBrand!(item.id) : undefined}
        accessibilityRole={openable ? 'button' : undefined}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={styles.rowMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {item.subtitle === 'Verified brand' && (
              <Icon name="checkmark-circle" size={15} color={colors.ink} />
            )}
          </View>
          {item.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
        {mode === 'following' && item.kind === 'brand' ? (
          <PressableScale
            style={styles.unfollowBtn}
            activeScale={0.95}
            onPress={() => handleUnfollow(item)}
            accessibilityRole="button"
            accessibilityLabel={`Unfollow ${item.name}`}
          >
            <Text style={styles.unfollowText}>Following</Text>
          </PressableScale>
        ) : openable ? (
          <Icon name="chevron-forward" size={18} color={colors.muted} />
        ) : null}
      </PressableScale>
    );
  };

  const emptyState = (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Icon
          name={mode === 'followers' ? 'people-outline' : 'person-add-outline'}
          size={32}
          color={colors.muted}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {mode === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
      </Text>
      <Text style={styles.emptyText}>
        {mode === 'followers'
          ? 'When people follow you, they will show up here.'
          : 'Follow brands you love from their profile to see their latest drops.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SubHeader title={title} onBack={onBack} />
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.ink} />
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.followId}
            renderItem={renderRow}
            contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.list}
            ListEmptyComponent={emptyState}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.ink} />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  emptyList: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.avatarBorder,
  },
  avatarPlaceholder: {
    backgroundColor: colors.tag,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h3,
    color: colors.ink,
  },
  rowMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.ink,
    flexShrink: 1,
  },
  subtitle: {
    ...typography.metaMuted,
    marginTop: 2,
  },
  unfollowBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.fill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  unfollowText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
    color: colors.ink,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x40,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: { ...typography.h2 },
  emptyText: {
    ...typography.metaMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
