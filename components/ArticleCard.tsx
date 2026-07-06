// ArticleCard — Reels-style, full-bleed article card. One tall cover photo
// with a right-side action rail (like / save / share) and a bottom gradient
// carrying brand · price · name · tags + the amber Visit pill.
//
// The card fills its parent, so the feed screen owns sizing/positioning and
// this component stays responsive. Data contract (props) is unchanged from
// the previous version so the feed wiring is preserved.

import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
  Linking,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/Ionicons';
import { Article } from '../types';
import { PressableScale } from './ui';
import { colors, radius, fontFamily, spacing, shadows } from '../theme';

interface ArticleCardProps {
  article: Article;
  onLikeChange: (articleId: string, isLiked: boolean) => void;
  onSaveChange: (articleId: string, isSaved: boolean) => void;
  /** Fired when the card (not the rail/Visit buttons) is tapped. */
  onPress?: (article: Article) => void;
  /** Fired when the brand name is tapped. */
  onBrandPress?: (brandId: string) => void;
  /** Optional container override (the feed sets height/margins here). */
  style?: StyleProp<ViewStyle>;
}

const RAIL_ICON = colors.onPhoto;

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onLikeChange,
  onSaveChange,
  onPress,
  onBrandPress,
  style,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const imageOpacity = useRef(new Animated.Value(0)).current;

  const imageUrl = useMemo(() => {
    const baseUrl = article.image_urls?.[0];
    if (!baseUrl) return null;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}_imgcache=${article.id.substring(0, 8)}`;
  }, [article.image_urls, article.id]);

  const price = `${article.currency} ${article.price?.toLocaleString() ?? '0'}`;
  const tags = (article.tags ?? []).slice(0, 3).join(' · ');

  const handleVisit = () => {
    if (article.purchase_url) {
      Linking.openURL(article.purchase_url).catch(() =>
        Alert.alert('Error', 'Unable to open the link. Please try again later.'),
      );
    } else {
      Alert.alert('No Purchase Link', "This article doesn't have a purchase link available.", [
        { text: 'OK' },
      ]);
    }
  };

  return (
    <Pressable
      style={[styles.card, style]}
      onPress={onPress ? () => onPress(article) : undefined}
      disabled={!onPress}
    >
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
              duration: 400,
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

      {/* Right action rail */}
      <View style={styles.rail}>
        <PressableScale
          style={styles.railBtn}
          activeScale={0.85}
          onPress={() => onLikeChange(article.id, !article.is_liked)}
          accessibilityLabel="Like"
        >
          <Icon
            name={article.is_liked ? 'heart' : 'heart-outline'}
            size={30}
            color={article.is_liked ? colors.heart : RAIL_ICON}
          />
          <Text style={styles.railCount}>{article.likes_count ?? 0}</Text>
        </PressableScale>

        <PressableScale
          style={styles.railBtn}
          activeScale={0.85}
          onPress={() => onSaveChange(article.id, !article.is_saved)}
          accessibilityLabel="Save"
        >
          <Icon
            name={article.is_saved ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={RAIL_ICON}
          />
        </PressableScale>

        <PressableScale style={styles.railBtn} activeScale={0.85} accessibilityLabel="Share">
          <Icon name="share-social-outline" size={26} color={RAIL_ICON} />
        </PressableScale>
      </View>

      {/* Bottom gradient info */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.info}
      >
        <View style={styles.metaRow}>
          <Text
            style={styles.brand}
            numberOfLines={1}
            onPress={onBrandPress ? () => onBrandPress(article.brand_id) : undefined}
            suppressHighlighting
          >
            {article.brand?.name ?? 'Unknown Brand'}
          </Text>
          <Text style={styles.price}>{price}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {article.title}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.category} numberOfLines={1}>
            {article.category}
            {tags ? ` · ${tags}` : ''}
          </Text>
          <PressableScale style={styles.visit} onPress={handleVisit} accessibilityLabel="Visit">
            <Text style={styles.visitText}>Visit</Text>
            <Icon name="arrow-forward" size={14} color={colors.onCta} />
          </PressableScale>
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
    bottom: 150,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  brand: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.9)',
  },
  price: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.onPhoto,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 26,
    color: colors.onPhoto,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  category: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  visit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cta,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  visitText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.onCta,
  },
});
