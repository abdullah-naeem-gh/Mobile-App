// HomeScreen — Articles feed. A paged, Reels-style vertical FlatList of
// ArticleCards. The page height is measured from the list viewport (onLayout)
// instead of a hardcoded Platform.OS fork, so it adapts to any device and to
// the tab bar. The AppHeader floats over a beige panel at the top.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, BeigePanel } from '../components/ui';
import { ArticleCard } from '../components/ArticleCard';
import { FiltersModal } from '../components/FiltersModal';
import { Article } from '../types';
import { articleService, ArticleFilters } from '../services/articleService';
import { preloadImages } from '../lib/imageUtils';
import { colors, spacing, fontFamily } from '../theme';

const PAGE_SIZE = 20;

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ArticleFilters>({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [pageHeight, setPageHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Card top offset = floating header height; bottom = breathing room.
  const headerOffset = insets.top + 60;

  const loadArticles = useCallback(
    async (currentPage: number, currentFilters: ArticleFilters, reset: boolean) => {
      if (loading && !reset) return;
      setLoading(true);
      const { data, error } = await articleService.getArticles(currentFilters, currentPage);
      if (error) {
        Alert.alert('Error', error);
      } else {
        const next = data ?? [];
        setArticles((prev) => (reset || currentPage === 0 ? next : [...prev, ...next]));
        setHasMore(next.length === PAGE_SIZE);
      }
      setLoading(false);
    },
    [loading],
  );

  useEffect(() => {
    loadArticles(0, filters, true);
    setPage(0);
  }, [filters]);

  // Preload the first few article + brand images for a smoother feed.
  useEffect(() => {
    if (articles.length === 0) return;
    const imageUrls = articles.slice(0, 5).map((a) => a.image_urls?.[0]).filter(Boolean) as string[];
    const logoUrls = articles.slice(0, 5).map((a) => a.brand?.logo_url).filter(Boolean) as string[];
    preloadImages([...imageUrls, ...logoUrls]);
  }, [articles]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadArticles(0, filters, true);
    setPage(0);
    setRefreshing(false);
  }, [loadArticles, filters]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadArticles(nextPage, filters, false);
    }
  }, [hasMore, loading, page, loadArticles, filters]);

  const handleApplyFilters = useCallback((newFilters: ArticleFilters) => {
    setFilters(newFilters);
  }, []);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.gender ||
      filters.category ||
      (filters.colors && filters.colors.length > 0) ||
      (filters.sizes && filters.sizes.length > 0) ||
      filters.priceRange,
  );

  const handleLikeChange = async (articleId: string, isLiked: boolean) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? { ...a, is_liked: isLiked, likes_count: a.likes_count + (isLiked ? 1 : -1) }
          : a,
      ),
    );
    const result = await articleService.toggleLike(articleId);
    if (!result.success) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId
            ? { ...a, is_liked: !isLiked, likes_count: a.likes_count + (isLiked ? -1 : 1) }
            : a,
        ),
      );
      Alert.alert('Error', result.error || 'Failed to update like');
    }
  };

  const handleSaveChange = async (articleId: string, isSaved: boolean) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? { ...a, is_saved: isSaved, saves_count: a.saves_count + (isSaved ? 1 : -1) }
          : a,
      ),
    );
    const result = await articleService.toggleSave(articleId);
    if (!result.success) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId
            ? { ...a, is_saved: !isSaved, saves_count: a.saves_count + (isSaved ? -1 : 1) }
            : a,
        ),
      );
      Alert.alert('Error', result.error || 'Failed to update save');
    }
  };

  const onListLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== pageHeight) setPageHeight(h);
  };

  const renderArticle = ({ item, index }: { item: Article; index: number }) => {
    // Subtle scale/opacity falloff for cards entering/leaving the viewport.
    const h = pageHeight || 1;
    const inputRange = [(index - 1) * h, index * h, (index + 1) * h];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.95, 1, 0.95],
      extrapolate: 'clamp',
    });
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.page,
          {
            height: pageHeight,
            paddingTop: headerOffset,
            paddingBottom: spacing.md,
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <ArticleCard
          article={item}
          onLikeChange={handleLikeChange}
          onSaveChange={handleSaveChange}
          onPress={() =>
            navigation.navigate('FullScreenArticle', { articles, initialIndex: index })
          }
          onBrandPress={(brandId) => navigation.navigate('BrandProfile', { brandId })}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <BeigePanel height={headerOffset + spacing.xl} />

      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <FlatList
          data={articles}
          renderItem={renderArticle}
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
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.ink} />
          }
          ListEmptyComponent={
            pageHeight > 0 && !loading ? (
              <View style={[styles.empty, { height: pageHeight, paddingTop: headerOffset }]}>
                <Text style={styles.emptyText}>No articles found</Text>
                <Text style={styles.emptySub}>Try adjusting your filters</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      {/* Floating header over the feed */}
      <View style={styles.header} pointerEvents="box-none">
        <AppHeader onFilter={() => setShowFiltersModal(true)} hasFilters={hasActiveFilters} />
      </View>

      <FiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
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
