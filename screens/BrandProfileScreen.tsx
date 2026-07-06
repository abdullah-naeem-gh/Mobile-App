// BrandProfileScreen — a brand's public page, reached by tapping a brand
// name. Cover + identity card (follow/message), then Articles / Lookbook
// tabs. Wired to the brands table + articleService.getArticles({ brandId }).
//
// Follow/unfollow is persisted via followService against the existing
// `follows` table. There is no in-app messaging system in this codebase yet
// (no conversations/chat table, no realtime wiring) — building one is a
// separate feature, not a redesign backfill. "Message" is an honest stub:
// it deep-links to email so a consumer can actually reach the brand today.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { supabase } from '../lib/supabase';
import { articleService } from '../services/articleService';
import { followService } from '../services/followService';
import { useAuth } from '../contexts/AuthContext';
import { Article, Brand } from '../types';
import { PressableScale } from '../components/ui';
import { colors, radius, spacing, fontFamily, shadows } from '../theme';

interface BrandProfileParams {
  brandId: string;
}

type Tab = 'articles' | 'lookbook';

interface OutfitRow {
  id: string;
  image_url: string;
}

export const BrandProfileScreen: React.FC<any> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { brandId } = route.params as BrandProfileParams;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [outfits, setOutfits] = useState<OutfitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('articles');
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: brandData }, articlesResult, { data: outfitData }, followerCountResult] = await Promise.all([
      supabase.from('brands').select('*').eq('id', brandId).single(),
      articleService.getArticles({ brandId }),
      supabase.from('outfits').select('id, image_url').eq('brand_id', brandId).eq('is_public', true),
      followService.getBrandFollowerCount(brandId),
    ]);
    if (brandData) setBrand(brandData as Brand);
    if (articlesResult.success && articlesResult.data) setArticles(articlesResult.data);
    setOutfits((outfitData as OutfitRow[]) || []);
    if (followerCountResult.success && followerCountResult.data !== undefined) {
      setFollowerCount(followerCountResult.data);
    }
    if (user) {
      const followingResult = await followService.isFollowingBrand(user.id, brandId);
      if (followingResult.success) setFollowing(!!followingResult.data);
    }
    setLoading(false);
  }, [brandId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleFollow = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Sign in to follow brands.');
      return;
    }
    if (followBusy) return;
    setFollowBusy(true);
    const previousFollowing = following;
    // Optimistic update, then reconcile with the server response.
    setFollowing(!previousFollowing);
    setFollowerCount((c) => (previousFollowing ? Math.max(0, c - 1) : c + 1));

    const result = await followService.toggleFollowBrand(user.id, brandId);
    if (!result.success) {
      setFollowing(previousFollowing);
      setFollowerCount((c) => (previousFollowing ? c + 1 : Math.max(0, c - 1)));
      Alert.alert('Error', result.error || 'Failed to update follow status');
    } else if (result.data) {
      setFollowing(result.data.following);
    }
    setFollowBusy(false);
  };

  const handleMessage = () => {
    // No in-app messaging system exists in this codebase yet. Deep-link to
    // email as an honest, minimal contact path rather than faking a chat UI.
    const subject = encodeURIComponent(`Message to ${brand?.name ?? 'brand'} via Kaprayy`);
    const url = `mailto:support@kaprayy.com?subject=${subject}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Unable to open mail app', 'Please email support@kaprayy.com directly.'),
    );
  };

  const cover = articles[0]?.image_urls?.[0] ?? brand?.logo_url;
  const gridData: { id: string; image: string | null }[] =
    tab === 'articles'
      ? articles.map((a) => ({ id: a.id, image: a.image_urls?.[0] ?? null }))
      : outfits.map((o) => ({ id: o.id, image: o.image_url ?? null }));

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.ink} />
        </View>
      </View>
    );
  }

  if (!brand) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered} edges={['top']}>
          <Icon name="storefront-outline" size={44} color={colors.muted} />
          <Text style={styles.emptyText}>Brand not found</Text>
          <PressableScale style={styles.backChip} onPress={() => navigation.goBack()}>
            <Text style={styles.backChipText}>Go back</Text>
          </PressableScale>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Cover */}
        <View style={styles.cover}>
          {cover ? <Image source={{ uri: cover }} style={styles.coverImage} resizeMode="cover" /> : null}
          <View style={styles.coverScrim} />
        </View>

        {/* Identity card overlapping the cover */}
        <View style={styles.card}>
          <View style={styles.identityRow}>
            {brand.logo_url ? (
              <Image source={{ uri: brand.logo_url }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoInitial}>{brand.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.identityInfo}>
              <Text style={styles.brandName} numberOfLines={1}>
                {brand.name}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.stat}>
                  <Text style={styles.statNum}>{brand.articles_count ?? articles.length}</Text> articles
                </Text>
                <Text style={styles.stat}>
                  <Text style={styles.statNum}>{followerCount}</Text> followers
                </Text>
              </View>
            </View>
          </View>

          {brand.description ? <Text style={styles.bio}>{brand.description}</Text> : null}

          <View style={styles.actions}>
            <PressableScale
              style={[styles.followBtn, following && styles.followingBtn]}
              activeScale={0.97}
              onPress={handleToggleFollow}
              disabled={followBusy}
            >
              <Text style={[styles.followText, following && styles.followingText]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </PressableScale>
            <PressableScale
              style={styles.messageBtn}
              activeScale={0.97}
              onPress={handleMessage}
            >
              <Text style={styles.messageText}>Message</Text>
            </PressableScale>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['articles', 'lookbook'] as Tab[]).map((t) => (
            <PressableScale key={t} activeScale={0.97} style={styles.tab} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'articles' ? 'Articles' : 'Lookbook'}
              </Text>
              <View style={[styles.tabUnderline, tab === t && styles.tabUnderlineActive]} />
            </PressableScale>
          ))}
        </View>

        {/* Grid */}
        {gridData.length > 0 ? (
          <FlatList
            data={gridData}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.gridImage} resizeMode="cover" />
                ) : (
                  <View style={styles.gridPlaceholder}>
                    <Icon name="image-outline" size={22} color={colors.muted} />
                  </View>
                )}
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyGrid}>
            <Text style={styles.emptyText}>No {tab === 'articles' ? 'articles' : 'looks'} yet</Text>
          </View>
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Floating top buttons */}
      <View style={[styles.chrome, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <PressableScale style={styles.chromeBtn} activeScale={0.9} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color={colors.ink} />
        </PressableScale>
        <PressableScale style={styles.chromeBtn} activeScale={0.9}>
          <Icon name="ellipsis-horizontal" size={18} color={colors.ink} />
        </PressableScale>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  scroll: { paddingBottom: spacing.xxl },
  cover: { height: 240, backgroundColor: colors.line },
  coverImage: { width: '100%', height: '100%' },
  coverScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  card: {
    marginTop: -50,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.float,
  },
  identityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginTop: -38,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.tag,
  },
  logoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  logoInitial: { fontFamily: fontFamily.bold, fontSize: 28, color: colors.ink },
  identityInfo: { flex: 1, minWidth: 0 },
  brandName: { fontFamily: fontFamily.bold, fontSize: 19, color: colors.ink, marginBottom: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.lg },
  stat: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  statNum: { fontFamily: fontFamily.bold, color: colors.ink },
  bio: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.sm },
  followBtn: {
    flex: 2,
    height: 42,
    borderRadius: radius.card,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingBtn: { backgroundColor: colors.input },
  followText: { fontFamily: fontFamily.bold, fontSize: 14, color: colors.onDark },
  followingText: { color: colors.ink },
  messageBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.card,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: { fontFamily: fontFamily.bold, fontSize: 14, color: colors.ink },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xxl,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tab: { alignItems: 'center' },
  tabText: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.muted, paddingVertical: spacing.md },
  tabTextActive: { fontFamily: fontFamily.bold, color: colors.ink },
  tabUnderline: { height: 2, width: 40, backgroundColor: 'transparent' },
  tabUnderlineActive: { backgroundColor: colors.ink },
  grid: { padding: spacing.md, gap: spacing.xs },
  gridRow: { gap: spacing.xs },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 3 / 4,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  gridImage: { width: '100%', height: '100%' },
  gridPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyGrid: { alignItems: 'center', paddingVertical: spacing.x40 },
  emptyText: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.muted },
  bottomSpace: { height: spacing.xxl },
  chrome: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  chromeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.hairline,
  },
  backChip: {
    marginTop: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.s10,
  },
  backChipText: { fontFamily: fontFamily.bold, fontSize: 14, color: colors.onDark },
});
