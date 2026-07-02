// OutfitFeedScreen — Outfits tab. Paged, Reels-style feed of user/brand
// looks. Same responsive page-measuring approach as HomeScreen; keeps the
// outfitService wiring (getOutfits / toggleLike / toggleSave).

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, BeigePanel } from '../components/ui';
import { OutfitCard } from '../components/OutfitCard';
import { outfitService } from '../services/outfitService';
import { useAuth } from '../contexts/AuthContext';
import { OutfitCardData } from '../types';
import { colors, spacing, fontFamily } from '../theme';

const PAGE_SIZE = 20;

export const OutfitFeedScreen: React.FC = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [outfits, setOutfits] = useState<OutfitCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [pageHeight, setPageHeight] = useState(0);

  const headerOffset = insets.top + 60;

  const loadOutfits = useCallback(
    async (currentPage: number, reset: boolean) => {
      if (loading && !reset) return;
      setLoading(true);
      const { data, error } = await outfitService.getOutfits({
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
        currentUserId: user?.id,
      });
      if (error) {
        Alert.alert('Error', error);
      } else {
        const next = (data ?? []) as OutfitCardData[];
        setOutfits((prev) => (reset || currentPage === 0 ? next : [...prev, ...next]));
        setHasMore(next.length === PAGE_SIZE);
      }
      setLoading(false);
    },
    [loading, user?.id],
  );

  useEffect(() => {
    loadOutfits(0, true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOutfits(0, true);
    setPage(0);
    setRefreshing(false);
  }, [loadOutfits]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOutfits(nextPage, false);
    }
  }, [hasMore, loading, page, loadOutfits]);

  const handleOutfitPress = (outfit: OutfitCardData) => {
    Alert.alert('Outfit Details', `Viewing outfit by ${outfit.user.username}`);
  };

  const handleLikeChange = async (outfitId: string, isLiked: boolean) => {
    if (!user) return;
    setOutfits((prev) =>
      prev.map((o) =>
        o.id === outfitId
          ? { ...o, is_liked: isLiked, likes_count: o.likes_count + (isLiked ? 1 : -1) }
          : o,
      ),
    );
    const result = await outfitService.toggleLike(outfitId);
    if (!result.success) {
      setOutfits((prev) =>
        prev.map((o) =>
          o.id === outfitId
            ? { ...o, is_liked: !isLiked, likes_count: o.likes_count + (isLiked ? -1 : 1) }
            : o,
        ),
      );
      Alert.alert('Error', result.error || 'Failed to update like');
    }
  };

  const handleSaveChange = async (outfitId: string, isSaved: boolean) => {
    if (!user) return;
    setOutfits((prev) =>
      prev.map((o) =>
        o.id === outfitId
          ? { ...o, is_saved: isSaved, saves_count: o.saves_count + (isSaved ? 1 : -1) }
          : o,
      ),
    );
    const result = await outfitService.toggleSave(outfitId);
    if (!result.success) {
      setOutfits((prev) =>
        prev.map((o) =>
          o.id === outfitId
            ? { ...o, is_saved: !isSaved, saves_count: o.saves_count + (isSaved ? -1 : 1) }
            : o,
        ),
      );
      Alert.alert('Error', result.error || 'Failed to update save');
    }
  };

  const onListLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== pageHeight) setPageHeight(h);
  };

  const renderOutfit = ({ item }: { item: OutfitCardData }) => (
    <View style={[styles.page, { height: pageHeight, paddingTop: headerOffset }]}>
      <OutfitCard
        outfit={item}
        onPress={handleOutfitPress}
        onLikeChange={handleLikeChange}
        onSaveChange={handleSaveChange}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <BeigePanel height={headerOffset + spacing.xl} />

      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <FlatList
          data={outfits}
          renderItem={renderOutfit}
          keyExtractor={(item) => item.id}
          onLayout={onListLayout}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={pageHeight || undefined}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.ink} />
          }
          ListEmptyComponent={
            pageHeight > 0 && !loading ? (
              <View style={[styles.empty, { height: pageHeight, paddingTop: headerOffset }]}>
                <Text style={styles.emptyText}>No outfits found</Text>
                <Text style={styles.emptySub}>Follow users to see their outfit posts</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      <View style={styles.header} pointerEvents="box-none">
        <AppHeader />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  page: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.ink,
  },
  emptySub: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.muted,
  },
});
