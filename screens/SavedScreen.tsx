// SavedScreen — the Saved tab (also embedded in Profile). Shows a mosaic of
// recent saves, "smart collections" derived client-side from the real saved
// items (All / Articles / Outfits), and a grid of the current selection.
// Keeps the Supabase load + unsave logic.
//
// TODO(backend): server-side smart collections (price-dropped, from followed
// brands, user boards) once those exist.

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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SubHeader, PressableScale } from '../components/ui';
import { colors, radius, spacing, fontFamily, shadows } from '../theme';

interface SavedItem {
  id: string;
  created_at: string;
  articles?: {
    id: string;
    title: string;
    image_urls: string[];
    price: number;
    currency: string;
    brands: { name: string };
  } | null;
  outfits?: {
    id: string;
    title: string;
    image_url: string;
    users: { username: string };
  } | null;
}

interface SavedScreenProps {
  onBack: () => void;
}

type Tab = 'all' | 'articles' | 'outfits';

const savedImage = (item: SavedItem): string | null =>
  item.articles ? item.articles.image_urls?.[0] ?? null : item.outfits?.image_url ?? null;

export const SavedScreen: React.FC<SavedScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Tab>('all');

  const loadSavedItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('id, created_at, article_id, outfit_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const hydrated = await Promise.all(
        (data || []).map(async (save): Promise<SavedItem> => {
          const item: SavedItem = { id: save.id, created_at: save.created_at, articles: null, outfits: null };
          if (save.article_id) {
            const { data: a } = await supabase
              .from('articles')
              .select('id, title, image_urls, price, currency, brands!articles_brand_id_fkey ( name )')
              .eq('id', save.article_id)
              .single();
            if (a) {
              item.articles = {
                id: a.id,
                title: a.title,
                image_urls: a.image_urls,
                price: a.price,
                currency: a.currency,
                brands: Array.isArray(a.brands) ? a.brands[0] : a.brands,
              };
            }
          }
          if (save.outfit_id) {
            const { data: o } = await supabase
              .from('outfits')
              .select('id, title, image_url, users!outfits_user_id_fkey ( username )')
              .eq('id', save.outfit_id)
              .single();
            if (o) {
              item.outfits = {
                id: o.id,
                title: o.title,
                image_url: o.image_url,
                users: Array.isArray(o.users) ? o.users[0] : o.users,
              };
            }
          }
          return item;
        }),
      );
      setSavedItems(hydrated);
    } catch {
      Alert.alert('Error', 'Failed to load saved items');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSavedItems();
  }, [loadSavedItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedItems();
    setRefreshing(false);
  };

  const handleUnsave = async (saveId: string) => {
    const { error } = await supabase.from('saves').delete().eq('id', saveId);
    if (error) Alert.alert('Error', 'Failed to remove item from saved');
    else setSavedItems((items) => items.filter((i) => i.id !== saveId));
  };

  const articleCount = useMemo(() => savedItems.filter((i) => i.articles).length, [savedItems]);
  const outfitCount = savedItems.length - articleCount;
  const mosaic = useMemo(
    () => savedItems.map(savedImage).filter(Boolean).slice(0, 5) as string[],
    [savedItems],
  );

  const filtered = useMemo(() => {
    if (selectedTab === 'articles') return savedItems.filter((i) => i.articles);
    if (selectedTab === 'outfits') return savedItems.filter((i) => i.outfits);
    return savedItems;
  }, [savedItems, selectedTab]);

  const collections: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All saves', count: savedItems.length },
    { id: 'articles', label: 'Articles', count: articleCount },
    { id: 'outfits', label: 'Outfits', count: outfitCount },
  ];

  const openItem = (item: SavedItem) => {
    const isArticle = !!item.articles;
    const title = isArticle ? item.articles?.title : item.outfits?.title;
    Alert.alert(isArticle ? 'Saved Article' : 'Saved Outfit', title || 'Untitled', [
      { text: 'Remove', style: 'destructive', onPress: () => handleUnsave(item.id) },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  const renderGridItem = ({ item }: { item: SavedItem }) => {
    const image = savedImage(item);
    return (
      <PressableScale
        style={styles.gridItem}
        activeScale={0.97}
        onPress={() => openItem(item)}
        onLongPress={() => handleUnsave(item.id)}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.gridImage} resizeMode="cover" />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Icon name="image-outline" size={22} color={colors.muted} />
          </View>
        )}
        {item.articles?.price ? (
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              {item.articles.currency || 'PKR'} {item.articles.price}
            </Text>
          </View>
        ) : null}
      </PressableScale>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SubHeader title="Saved" onBack={onBack} />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.ink} />
          </View>
        ) : savedItems.length === 0 ? (
          <View style={styles.centered}>
            <Icon name="bookmark-outline" size={44} color={colors.tag} />
            <Text style={styles.emptyText}>Nothing saved yet</Text>
            <Text style={styles.emptySub}>Bookmark articles and outfits to find them here</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.ink} />
            }
          >
            {/* Mosaic of recent saves */}
            {mosaic.length > 0 ? (
              <View style={styles.mosaic}>
                <View style={styles.mosaicLead}>
                  <Image source={{ uri: mosaic[0] }} style={styles.mosaicImage} resizeMode="cover" />
                </View>
                <View style={styles.mosaicSide}>
                  {mosaic.slice(1, 5).map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.mosaicThumb} resizeMode="cover" />
                  ))}
                </View>
              </View>
            ) : null}

            <Text style={styles.countText}>{savedItems.length} items saved</Text>

            {/* Smart collections */}
            <Text style={styles.sectionTitle}>Collections</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.collectionsRow}
            >
              {collections.map((c) => (
                <PressableScale
                  key={c.id}
                  activeScale={0.97}
                  onPress={() => setSelectedTab(c.id)}
                  style={[styles.collectionCard, selectedTab === c.id && styles.collectionCardActive]}
                >
                  <Text style={styles.collectionLabel}>{c.label}</Text>
                  <Text style={styles.collectionCount}>{c.count} items</Text>
                </PressableScale>
              ))}
            </ScrollView>

            {/* Grid of the selected collection */}
            <FlatList
              data={filtered}
              renderItem={renderGridItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.grid}
            />
            <View style={styles.bottomSpace} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

const GAP = spacing.sm;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyText: { fontFamily: fontFamily.bold, fontSize: 18, color: colors.ink },
  emptySub: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },

  mosaic: { flexDirection: 'row', gap: GAP, height: 200, marginTop: spacing.sm },
  mosaicLead: { flex: 2, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.line },
  mosaicImage: { width: '100%', height: '100%' },
  mosaicSide: { flex: 1, gap: GAP },
  mosaicThumb: { flex: 1, borderRadius: radius.card, backgroundColor: colors.line },

  countText: { fontFamily: fontFamily.bold, fontSize: 13, color: colors.ink, marginTop: spacing.md },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.ink, marginTop: spacing.xl, marginBottom: spacing.md },

  collectionsRow: { gap: spacing.s10, paddingRight: spacing.lg },
  collectionCard: {
    width: 140,
    borderRadius: radius.input,
    backgroundColor: colors.panel,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.hairline,
  },
  collectionCardActive: { borderWidth: 2, borderColor: colors.ink },
  collectionLabel: { fontFamily: fontFamily.bold, fontSize: 13, color: colors.ink },
  collectionCount: { fontFamily: fontFamily.regular, fontSize: 11, color: colors.muted },

  grid: { marginTop: spacing.xl, gap: GAP },
  gridRow: { gap: GAP },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 3 / 4,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  gridImage: { width: '100%', height: '100%' },
  gridPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  priceTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  priceText: { fontFamily: fontFamily.bold, fontSize: 10, color: '#fff' },
  bottomSpace: { height: spacing.xxl },
});
