// OutfitCard — Reels-style full-bleed outfit card. Same chassis as
// ArticleCard, with author/time-ago meta instead of brand/price and a
// "Show Articles" pill that toggles the tag overlay. Binds to the typed
// OutfitCardData shape returned by outfitService.getOutfits.

import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
  Linking,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { OutfitTagsOverlay } from './OutfitTagsOverlay';
import { PressableScale } from './ui';
import { OutfitCardData } from '../types';
import { formatTimeAgo } from '../utils/time';
import { colors, radius, fontFamily, spacing, shadows } from '../theme';

interface OutfitCardProps {
  outfit: OutfitCardData;
  onPress: (outfit: OutfitCardData) => void;
  onLikeChange: (outfitId: string, isLiked: boolean) => void;
  onSaveChange: (outfitId: string, isSaved: boolean) => void;
  style?: StyleProp<ViewStyle>;
}

const RAIL_ICON = colors.onPhoto;

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  onPress,
  onLikeChange,
  onSaveChange,
  style,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showArticles, setShowArticles] = useState(false);
  const imageOpacity = useRef(new Animated.Value(0)).current;

  const imageUrl = useMemo(() => {
    const baseUrl = outfit.image_urls?.[0];
    if (!baseUrl) return null;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}_imgcache=${outfit.id.substring(0, 8)}`;
  }, [outfit.image_urls, outfit.id]);

  const hasArticles = Boolean(outfit.outfit_articles && outfit.outfit_articles.length > 0);
  const tags = (outfit.style_tags ?? []).slice(0, 3).join(' · ');
  const initial = outfit.user?.username?.charAt(0)?.toUpperCase() ?? 'U';

  const openArticle = (purchaseUrl?: string, title?: string) => {
    if (purchaseUrl) {
      Linking.openURL(purchaseUrl).catch(() =>
        Alert.alert('Error', 'Unable to open the link. Please try again later.'),
      );
    } else {
      Alert.alert(title ?? 'Article', "This article doesn't have a purchase link available.", [
        { text: 'OK' },
      ]);
    }
  };

  return (
    <Pressable style={[styles.card, style]} onPress={() => onPress(outfit)}>
      {/* Full-bleed photo */}
      {imageUrl && !imageError ? (
        <Animated.Image
          source={{ uri: imageUrl }}
          style={[styles.photo, { opacity: imageOpacity }]}
          resizeMode="cover"
          onLoad={() => {
            setImageLoading(false);
            Animated.timing(imageOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
      ) : (
        <View style={styles.fallback}>
          <Icon name="image-outline" size={40} color={colors.muted} />
          <Text style={styles.fallbackText}>
            {imageUrl ? 'Failed to load image' : 'No image available'}
          </Text>
        </View>
      )}

      {imageLoading && imageUrl && !imageError ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.muted} />
        </View>
      ) : null}

      {/* Tag overlay (toggled by Show Articles) */}
      {!imageLoading && hasArticles && showArticles ? (
        <OutfitTagsOverlay
          outfitArticles={outfit.outfit_articles!}
          showCards
          onTagPress={(a) => openArticle(a.articles.purchase_url, a.articles.title)}
        />
      ) : null}

      {/* Right action rail */}
      <View style={styles.rail}>
        <PressableScale
          style={styles.railBtn}
          activeScale={0.85}
          onPress={() => onLikeChange(outfit.id, !outfit.is_liked)}
          accessibilityLabel="Like"
        >
          <Icon
            name={outfit.is_liked ? 'heart' : 'heart-outline'}
            size={30}
            color={outfit.is_liked ? colors.heart : RAIL_ICON}
          />
          <Text style={styles.railCount}>{outfit.likes_count ?? 0}</Text>
        </PressableScale>

        <PressableScale
          style={styles.railBtn}
          activeScale={0.85}
          onPress={() => onSaveChange(outfit.id, !outfit.is_saved)}
          accessibilityLabel="Save"
        >
          <Icon
            name={outfit.is_saved ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={RAIL_ICON}
          />
          <Text style={styles.railCount}>{outfit.saves_count ?? 0}</Text>
        </PressableScale>

        <PressableScale style={styles.railBtn} activeScale={0.85} accessibilityLabel="Share">
          <Icon name="share-social-outline" size={26} color={RAIL_ICON} />
        </PressableScale>
      </View>

      {/* Bottom gradient info */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.info}
      >
        <View style={styles.userRow}>
          {outfit.user?.profile_image_url ? (
            <Image source={{ uri: outfit.user.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <View style={styles.userMeta}>
            <Text style={styles.username} numberOfLines={1}>
              {outfit.user?.username ?? 'Unknown User'}
            </Text>
            <Text style={styles.timestamp}>{formatTimeAgo(outfit.created_at)}</Text>
          </View>
        </View>

        {outfit.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {outfit.description}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          <Text style={styles.tags} numberOfLines={1}>
            {tags}
          </Text>
          {hasArticles ? (
            <PressableScale
              style={styles.showArticles}
              onPress={() => setShowArticles((s) => !s)}
              accessibilityLabel={showArticles ? 'Hide articles' : 'Show articles'}
            >
              <Text style={styles.showArticlesText}>
                {showArticles ? 'Hide Articles' : 'Show Articles'}
              </Text>
              <Icon
                name={showArticles ? 'chevron-up' : 'arrow-forward'}
                size={14}
                color={colors.onCta}
              />
            </PressableScale>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.panel,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.fill,
  },
  fallbackText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.muted,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    right: spacing.md,
    bottom: 160,
    alignItems: 'center',
    gap: spacing.xl,
    zIndex: 3,
  },
  railBtn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  railCount: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.onPhoto,
  },
  info: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingTop: spacing.x40,
    gap: spacing.s10,
    zIndex: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tag,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.ink,
  },
  userMeta: {
    flex: 1,
  },
  username: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.onPhoto,
  },
  timestamp: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.95)',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tags: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  showArticles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cta,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  showArticlesText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.onCta,
  },
});
