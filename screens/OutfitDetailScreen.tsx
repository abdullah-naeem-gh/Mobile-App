// OutfitDetailScreen — full detail view for a single outfit, opened by
// tapping a card in the Outfits feed or the Profile grid. Hero photo with
// the tag overlay toggle, like/save actions wired to outfitService, then a
// scrollable panel: creator row, description, style tags and the tagged
// articles as shoppable rows.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { outfitService } from '../services/outfitService';
import { OutfitTagsOverlay } from '../components/OutfitTagsOverlay';
import { PressableScale, TagPill, Button } from '../components/ui';
import { OutfitCardData, OutfitCardArticle } from '../types';
import { formatTimeAgo } from '../utils/time';
import { colors, radius, spacing, fontFamily, fontSize, typography, shadows } from '../theme';

// Typed loosely to satisfy the navigator's ScreenComponentType; params carry
// the OutfitCardData from the feed / profile grid.
export const OutfitDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const outfit: OutfitCardData = route.params.outfit;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [isLiked, setIsLiked] = useState(outfit.is_liked);
  const [isSaved, setIsSaved] = useState(outfit.is_saved);
  const [likesCount, setLikesCount] = useState(outfit.likes_count ?? 0);
  const [savesCount, setSavesCount] = useState(outfit.saves_count ?? 0);
  const [showTags, setShowTags] = useState(false);

  const imageUrl = outfit.image_urls?.[0] ?? null;
  const articles = outfit.outfit_articles ?? [];
  const styleTags = outfit.style_tags ?? [];
  const initial = outfit.user?.username?.charAt(0)?.toUpperCase() ?? 'U';

  const handleLike = async () => {
    if (!user) return;
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    const result = await outfitService.toggleLike(outfit.id);
    if (!result.success) {
      setIsLiked(!next);
      setLikesCount((c) => c + (next ? -1 : 1));
      Alert.alert('Error', result.error || 'Failed to update like');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const next = !isSaved;
    setIsSaved(next);
    setSavesCount((c) => c + (next ? 1 : -1));
    const result = await outfitService.toggleSave(outfit.id);
    if (!result.success) {
      setIsSaved(!next);
      setSavesCount((c) => c + (next ? -1 : 1));
      Alert.alert('Error', result.error || 'Failed to update save');
    }
  };

  const openArticle = (article: OutfitCardArticle['articles']) => {
    if (article.purchase_url) {
      Linking.openURL(article.purchase_url).catch(() =>
        Alert.alert('Error', 'Unable to open the link. Please try again later.'),
      );
    } else {
      Alert.alert(article.title, "This article doesn't have a purchase link available.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero photo */}
        <View style={styles.hero}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoFallback}>
              <Icon name="image-outline" size={40} color={colors.muted} />
            </View>
          )}

          {articles.length > 0 && showTags ? (
            <OutfitTagsOverlay
              outfitArticles={articles}
              showCards
              onTagPress={(a) => openArticle(a.articles)}
            />
          ) : null}

          {/* Back button over the photo */}
          <PressableScale
            style={[styles.backBtn, { top: insets.top + spacing.sm }]}
            activeScale={0.9}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Icon name="chevron-back" size={20} color={colors.ink} />
          </PressableScale>

          {articles.length > 0 ? (
            <PressableScale
              style={styles.tagToggle}
              activeScale={0.95}
              onPress={() => setShowTags((s) => !s)}
              accessibilityRole="button"
            >
              <Text style={styles.tagToggleText}>
                {showTags ? 'Hide Articles' : 'Show Articles'}
              </Text>
              <Icon
                name={showTags ? 'chevron-up' : 'pricetag-outline'}
                size={14}
                color={colors.onCta}
              />
            </PressableScale>
          ) : null}
        </View>

        {/* Detail panel */}
        <View style={styles.panel}>
          {/* Creator + actions */}
          <View style={styles.creatorRow}>
            {outfit.user?.profile_image_url ? (
              <Image source={{ uri: outfit.user.profile_image_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.creatorMeta}>
              <Text style={styles.username} numberOfLines={1}>
                {outfit.user?.username ?? 'Unknown User'}
              </Text>
              <Text style={styles.timestamp}>{formatTimeAgo(outfit.created_at)}</Text>
            </View>

            <PressableScale style={styles.actionBtn} activeScale={0.85} onPress={handleLike}>
              <Icon
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? colors.heart : colors.ink}
              />
              <Text style={styles.actionCount}>{likesCount}</Text>
            </PressableScale>
            <PressableScale style={styles.actionBtn} activeScale={0.85} onPress={handleSave}>
              <Icon
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={colors.ink}
              />
              <Text style={styles.actionCount}>{savesCount}</Text>
            </PressableScale>
          </View>

          {outfit.description ? (
            <Text style={styles.description}>{outfit.description}</Text>
          ) : null}

          {styleTags.length > 0 ? (
            <View style={styles.tagRow}>
              {styleTags.map((tag) => (
                <TagPill key={tag} label={tag} />
              ))}
            </View>
          ) : null}

          {/* Tagged articles */}
          {articles.length > 0 ? (
            <View style={styles.articlesSection}>
              <Text style={styles.sectionTitle}>Articles in this outfit</Text>
              {articles.map((a, i) => (
                <View key={`${a.articles.id}-${i}`} style={styles.articleRow}>
                  {a.articles.image_urls?.[0] ? (
                    <Image
                      source={{ uri: a.articles.image_urls[0] }}
                      style={styles.articleThumb}
                    />
                  ) : (
                    <View style={[styles.articleThumb, styles.articleThumbFallback]}>
                      <Icon name="shirt-outline" size={20} color={colors.muted} />
                    </View>
                  )}
                  <View style={styles.articleMeta}>
                    <Text style={styles.articleTitle} numberOfLines={1}>
                      {a.articles.title}
                    </Text>
                    {a.articles.price != null ? (
                      <Text style={styles.articlePrice}>
                        {a.articles.currency ?? 'PKR'} {a.articles.price}
                      </Text>
                    ) : null}
                  </View>
                  <Button
                    label="Visit"
                    variant="inline"
                    onPress={() => openArticle(a.articles)}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
      <SafeAreaView edges={['bottom']} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.x40 },
  hero: {
    height: 480,
    backgroundColor: colors.fill,
    borderBottomLeftRadius: radius.panel,
    borderBottomRightRadius: radius.panel,
    overflow: 'hidden',
  },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  photoFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  tagToggle: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cta,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  tagToggleText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.micro,
    color: colors.onCta,
  },
  panel: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  creatorMeta: { flex: 1 },
  username: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.ink,
  },
  timestamp: { ...typography.metaMuted, marginTop: 2 },
  actionBtn: { alignItems: 'center', gap: 2, marginLeft: spacing.md },
  actionCount: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.micro,
    color: colors.ink,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  articlesSection: { gap: spacing.md, marginTop: spacing.sm },
  sectionTitle: { ...typography.h2 },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.input,
    borderRadius: radius.panel,
    padding: spacing.md,
  },
  articleThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    backgroundColor: colors.fill,
  },
  articleThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  articleMeta: { flex: 1 },
  articleTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.meta,
    color: colors.ink,
  },
  articlePrice: { ...typography.metaMuted, marginTop: 2 },
});
