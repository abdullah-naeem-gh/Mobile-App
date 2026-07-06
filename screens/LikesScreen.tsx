// LikesScreen — liked articles + outfits, opened from the Profile menu.
// Re-skinned to match SavedScreen: SubHeader, chip filter row (All / Articles
// / Outfits) and a 3-column grid with a price pill + heart badge. Keeps the
// likesService wiring (getLikedItems / removeLike) and the per-image loading
// placeholders.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { likesService, LikedItem } from '../services/likesService';
import { SubHeader, Chip, PressableScale } from '../components/ui';
import { colors, radius, spacing, fontFamily } from '../theme';

interface LikesScreenProps {
  onBack: () => void;
}

type Tab = 'all' | 'articles' | 'outfits';

const likedImage = (item: LikedItem): string | null =>
  item.articles
    ? item.articles.image_urls?.[0] ?? null
    : item.outfits?.image_url ?? null;

export const LikesScreen: React.FC<LikesScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [likedItems, setLikedItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Tab>('all');
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});

  const loadLikedItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await likesService.getLikedItems(user.id);
    if (result.success && result.data) {
      setLikedItems(result.data);
    } else {
      Alert.alert('Error', result.error || 'Failed to load liked items');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadLikedItems();
  }, [loadLikedItems]);

  // Initialize per-image loading flags whenever liked items change.
  useEffect(() => {
    if (likedItems.length === 0) return;
    setImageLoadingStates((prev) => {
      const next = { ...prev };
      let changed = false;
      likedItems.forEach((item) => {
        if (next[item.id] === undefined) {
          next[item.id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [likedItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLikedItems();
    setRefreshing(false);
  };

  const handleUnlike = async (likeId: string) => {
    const result = await likesService.removeLike(likeId);
    if (result.success) {
      setLikedItems((items) => items.filter((item) => item.id !== likeId));
    } else {
      Alert.alert('Error', 'Failed to remove item from liked');
    }
  };

  const handleImageLoaded = (itemId: string) =>
    setImageLoadingStates((prev) => ({ ...prev, [itemId]: false }));

  const handleItemPress = (item: LikedItem) => {
    const isArticle = !!item.articles;
    const title = isArticle ? item.articles?.title : item.outfits?.title;
    const creator = isArticle ? item.articles?.brands?.name : item.outfits?.users?.username;
    Alert.alert(
      isArticle ? 'Liked Article' : 'Liked Outfit',
      `${title || 'Untitled'}\nBy: ${creator || 'Unknown'}\n\nLiked: ${new Date(item.created_at).toLocaleDateString()}`,
      [
        { text: 'Remove', style: 'destructive', onPress: () => handleUnlike(item.id) },
        { text: 'Close', style: 'cancel' },
      ],
    );
  };

  const handleLongPress = (item: LikedItem) => {
    const isArticle = !!item.articles;
    const title = isArticle ? item.articles?.title : item.outfits?.title;
    Alert.alert('Remove from Liked', `Remove "${title || 'Untitled'}" from your liked items?`, [
      { text: 'Remove', style: 'destructive', onPress: () => handleUnlike(item.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const articleCount = useMemo(() => likedItems.filter((i) => i.articles).length, [likedItems]);
  const outfitCount = likedItems.length - articleCount;

  const filtered = useMemo(() => {
    if (selectedTab === 'articles') return likedItems.filter((i) => i.articles);
    if (selectedTab === 'outfits') return likedItems.filter((i) => i.outfits);
    return likedItems;
  }, [likedItems, selectedTab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: `All (${likedItems.length})` },
    { id: 'articles', label: `Articles (${articleCount})` },
    { id: 'outfits', label: `Outfits (${outfitCount})` },
  ];

  const renderGridItem = ({ item }: { item: LikedItem }) => {
    const image = likedImage(item);
    const isImageLoading = imageLoadingStates[item.id] !== false;

    return (
      <PressableScale
        style={styles.gridItem}
        activeScale={0.97}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleLongPress(item)}
      >
        {image ? (
          <>
            {isImageLoading ? (
              <View style={styles.gridImageLoading}>
                <ActivityIndicator size="small" color={colors.muted} />
              </View>
            ) : null}
            <Image
              source={{ uri: image }}
              style={styles.gridImage}
              resizeMode="cover"
              onLoad={() => handleImageLoaded(item.id)}
              onError={() => handleImageLoaded(item.id)}
            />
          </>
        ) : (
          <View style={styles.gridPlaceholder}>
            <Icon name="image-outline" size={22} color={colors.muted} />
          </View>
        )}

        {item.articles?.price && !isImageLoading ? (
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              {item.articles.currency || 'PKR'} {item.articles.price}
            </Text>
          </View>
        ) : null}

        <View style={styles.heartBadge}>
          <Icon name="heart" size={12} color={colors.heart} />
        </View>
      </PressableScale>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SubHeader title="Likes" onBack={onBack} />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.ink} />
          </View>
        ) : likedItems.length === 0 ? (
          <View style={styles.centered}>
            <Icon name="heart-outline" size={44} color={colors.tag} />
            <Text style={styles.emptyText}>No liked items</Text>
            <Text style={styles.emptySub}>
              Items you like will appear here. Start exploring and like items you love!
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.ink} />
            }
            ListHeaderComponent={
              <View style={styles.tabs}>
                {tabs.map((t) => (
                  <Chip
                    key={t.id}
                    label={t.label}
                    active={selectedTab === t.id}
                    onPress={() => setSelectedTab(t.id)}
                  />
                ))}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyFiltered}>
                <Text style={styles.emptySub}>
                  No liked {selectedTab === 'articles' ? 'articles' : 'outfits'} yet
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const GAP = spacing.sm;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyText: { fontFamily: fontFamily.bold, fontSize: 18, color: colors.ink },
  emptySub: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
  emptyFiltered: { alignItems: 'center', paddingVertical: spacing.x40 },

  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },

  grid: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: GAP },
  gridRow: { gap: GAP },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 3 / 4,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  gridImage: { width: '100%', height: '100%' },
  gridImageLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fill,
    zIndex: 1,
  },
  gridPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  priceTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: colors.pillOverlay,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  priceText: { fontFamily: fontFamily.bold, fontSize: 10, color: colors.onDark },
  heartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.frost,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
