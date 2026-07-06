// ProfileScreen — the Profile tab for both brand and consumer roles. Loads
// the role-appropriate profile + content grid from Supabase, and hosts the
// settings drawer (MenuScreen) plus the Saved/Likes sub-screens it opens.
// Presentation is split into ProfileHeroCard + ProfilePostsGrid.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MenuScreen } from './MenuScreen';
import { SavedScreen } from './SavedScreen';
import { LikesScreen } from './LikesScreen';
import { SubHeader, PressableScale, Chip } from '../components/ui';
import { ProfileHeroCard } from '../components/profile/ProfileHeroCard';
import { ProfilePostsGrid, GridItem } from '../components/profile/ProfilePostsGrid';
import { colors, spacing, radius, fontFamily } from '../theme';

interface BrandProfile {
  id: string;
  name: string;
  email: string;
  logo_url?: string;
  description?: string;
  website_url?: string;
  followers_count: number;
  following_count: number;
  articles_count: number;
  outfits_count: number;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profile_image_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  outfits_count: number;
}

type ContentType = 'articles' | 'outfits';

interface ContentRow {
  id: string;
  title?: string;
  image_urls?: string[];
  image_url?: string;
  price?: number;
  currency?: string;
  created_at: string;
}

export const ProfileScreen: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<BrandProfile | UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentType>('articles');
  const [articles, setArticles] = useState<ContentRow[]>([]);
  const [outfits, setOutfits] = useState<ContentRow[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSavedScreen, setShowSavedScreen] = useState(false);
  const [showLikesScreen, setShowLikesScreen] = useState(false);

  const isBrand = userRole === 'brand';

  const loadProfile = useCallback(async () => {
    if (!user || !userRole) return;
    setLoading(true);
    try {
      if (userRole === 'brand') {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('id, name, description, logo_url, website_url, followers_count, articles_count')
          .eq('id', user.id)
          .single();
        if (brandError) throw new Error('Failed to fetch brand profile');

        const [articlesCount, outfitsCount, followersCount] = await Promise.all([
          supabase.from('articles').select('id', { count: 'exact', head: true }).eq('brand_id', user.id),
          supabase.from('outfits').select('id', { count: 'exact', head: true }).eq('brand_id', user.id),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_brand_id', user.id),
        ]);
        const { count: followingCount } = await supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        setProfile({
          id: brandData.id,
          name: brandData.name,
          email: user.email || '',
          logo_url: brandData.logo_url,
          description: brandData.description,
          website_url: brandData.website_url,
          followers_count: followersCount.count || 0,
          following_count: followingCount || 0,
          articles_count: articlesCount.count || 0,
          outfits_count: outfitsCount.count || 0,
        });
        setSelectedContent('articles');
      } else {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username, full_name, bio, profile_pic_url, followers_count, following_count, posts_count')
          .eq('id', user.id)
          .single();
        if (userError) throw new Error('Failed to fetch user profile');

        const [outfitsCount, followersCount] = await Promise.all([
          supabase.from('outfits').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_user_id', user.id),
        ]);
        const { count: followingCount } = await supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        setProfile({
          id: userData.id,
          username: userData.username,
          email: user.email || '',
          profile_image_url: userData.profile_pic_url,
          bio: userData.bio,
          followers_count: followersCount.count || 0,
          following_count: followingCount || 0,
          outfits_count: outfitsCount.count || 0,
        });
        setSelectedContent('outfits');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  const loadContent = useCallback(async () => {
    if (!user || !userRole) return;
    setContentLoading(true);
    setContentError(null);
    try {
      if (userRole === 'brand' && selectedContent === 'articles') {
        const { data } = await supabase
          .from('articles')
          .select('id, title, image_urls, price, currency, created_at')
          .eq('brand_id', user.id)
          .eq('is_available', true)
          .order('created_at', { ascending: false });
        setArticles(data || []);
      } else {
        const column = userRole === 'brand' ? 'brand_id' : 'user_id';
        const { data } = await supabase
          .from('outfits')
          .select('id, title, image_url, created_at')
          .eq(column, user.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });
        setOutfits(data || []);
      }
    } catch {
      setContentError('Failed to load content. Please try again.');
    } finally {
      setContentLoading(false);
    }
  }, [user, userRole, selectedContent]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile && userRole) loadContent();
  }, [profile, userRole, selectedContent, loadContent]);

  // Refresh when returning to the tab (e.g. after editing the profile).
  useEffect(() => navigation.addListener('focus', loadProfile), [navigation, loadProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadContent()]);
    setRefreshing(false);
  };

  const handleMenuNavigate = (screen: string) => {
    if (screen === 'Saved') setShowSavedScreen(true);
    else if (screen === 'Likes') setShowLikesScreen(true);
    else Alert.alert(screen, `${screen} functionality will be implemented`);
  };

  const contentData: ContentRow[] = isBrand
    ? selectedContent === 'articles'
      ? articles
      : outfits
    : outfits;

  const isArticleView = isBrand && selectedContent === 'articles';
  const gridData: GridItem[] = contentData.map((item) => ({
    id: item.id,
    image: isArticleView ? item.image_urls?.[0] ?? null : item.image_url ?? null,
    price: item.price,
    currency: item.currency,
  }));

  if (showSavedScreen) return <SavedScreen onBack={() => setShowSavedScreen(false)} />;
  if (showLikesScreen) return <LikesScreen onBack={() => setShowLikesScreen(false)} />;

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.ink} />
            <Text style={styles.centeredText}>Loading profile…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.centered}>
            <Icon name="person-outline" size={48} color={colors.muted} />
            <Text style={styles.centeredText}>Failed to load profile</Text>
            <PressableScale style={styles.retry} onPress={loadProfile}>
              <Text style={styles.retryText}>Try Again</Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const name = isBrand ? (profile as BrandProfile).name : (profile as UserProfile).username;
  const bio = isBrand ? (profile as BrandProfile).description : (profile as UserProfile).bio;
  const avatarUrl = isBrand
    ? (profile as BrandProfile).logo_url
    : (profile as UserProfile).profile_image_url;
  const postCount = isBrand
    ? (profile as BrandProfile).articles_count + (profile as BrandProfile).outfits_count
    : (profile as UserProfile).outfits_count;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SubHeader
          title="Profile"
          trailing={
            <View style={styles.headerActions}>
              <PressableScale style={styles.headerBtn} activeScale={0.9} onPress={() => setShowMenu(true)}>
                <Icon name="settings-outline" size={22} color={colors.ink} />
              </PressableScale>
            </View>
          }
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.ink} />
          }
        >
          <ProfileHeroCard
            name={name}
            initial={name.charAt(0).toUpperCase()}
            bio={bio}
            website={isBrand ? (profile as BrandProfile).website_url : undefined}
            avatarUrl={avatarUrl}
            stats={{
              posts: postCount,
              followers: profile.followers_count,
              following: profile.following_count,
            }}
            onEdit={() =>
              navigation.navigate('EditProfile', {
                name,
                bio: bio ?? '',
                avatarUrl: avatarUrl ?? null,
                isBrand,
              })
            }
          />

          {isBrand ? (
            <View style={styles.tabs}>
              <Chip
                label={`Articles (${articles.length})`}
                active={selectedContent === 'articles'}
                onPress={() => setSelectedContent('articles')}
              />
              <Chip
                label={`Outfits (${outfits.length})`}
                active={selectedContent === 'outfits'}
                onPress={() => setSelectedContent('outfits')}
              />
            </View>
          ) : null}

          <ProfilePostsGrid
            title={isArticleView ? 'Articles' : 'Outfits'}
            data={gridData}
            loading={contentLoading}
            error={contentError}
            emptyLabel={`No ${isArticleView ? 'articles' : 'outfits'} yet`}
            onRetry={loadContent}
            onPressItem={(id) => {
              const item = contentData.find((c) => c.id === id);
              Alert.alert(
                isArticleView ? 'Article' : 'Outfit',
                item?.title || 'Untitled',
              );
            }}
          />

          <View style={styles.bottomSpace} />
        </ScrollView>
      </SafeAreaView>

      <MenuScreen visible={showMenu} onClose={() => setShowMenu(false)} onNavigate={handleMenuNavigate} />
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
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  centeredText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.muted,
  },
  retry: {
    marginTop: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.round,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.s10,
  },
  retryText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.onDark,
  },
  bottomSpace: {
    height: spacing.xxl,
  },
});
