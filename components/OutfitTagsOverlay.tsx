// OutfitTagsOverlay — read-only tag markers (and optional info cards) shown
// on top of an outfit photo in the feed. Re-skinned to the design system:
// sand marker circles and a tokenized dark card. Percent-based positioning
// logic is unchanged from the original.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, fontFamily, spacing, shadows } from '../theme';

interface OutfitArticle {
  x_position: number;
  y_position: number;
  articles: {
    id: string;
    title: string;
    price?: number;
    currency?: string;
    image_urls?: string[];
    purchase_url?: string;
  };
}

interface OutfitTagsOverlayProps {
  outfitArticles: OutfitArticle[];
  onTagPress?: (article: OutfitArticle) => void;
  showCards?: boolean;
}

export const OutfitTagsOverlay: React.FC<OutfitTagsOverlayProps> = ({
  outfitArticles,
  onTagPress,
  showCards = false,
}) => {
  if (!outfitArticles || outfitArticles.length === 0) {
    return null;
  }

  const renderTagCard = (outfitArticle: OutfitArticle) => {
    if (!showCards) return null;

    const { x_position, y_position, articles } = outfitArticle;

    // Flip the card to whichever side of the marker has room.
    const isLeft = x_position > 50;
    const isTop = y_position > 50;

    return (
      <TouchableOpacity
        key={`card-${articles.id}`}
        style={[
          styles.tagCard,
          {
            position: 'absolute',
            left: isLeft ? undefined : `${x_position + 2}%`,
            right: isLeft ? `${100 - x_position + 2}%` : undefined,
            top: isTop ? undefined : `${y_position + 2}%`,
            bottom: isTop ? `${100 - y_position + 2}%` : undefined,
          } as ViewStyle,
        ]}
        onPress={() => onTagPress && onTagPress(outfitArticle)}
        disabled={!onTagPress}
        activeOpacity={0.8}
      >
        <View style={styles.tagCardContent}>
          <Text style={styles.tagCardTitle} numberOfLines={1}>
            {articles.title}
          </Text>
          {articles.price && (
            <Text style={styles.tagCardPrice}>
              {articles.currency || 'PKR'} {articles.price}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.tagCardArrow,
            isLeft ? styles.tagCardArrowRight : styles.tagCardArrowLeft,
            isTop ? styles.tagCardArrowBottom : styles.tagCardArrowTop,
          ]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Render tags */}
      {outfitArticles.map((outfitArticle) => {
        const { x_position, y_position, articles } = outfitArticle;

        return (
          <React.Fragment key={articles.id}>
            {/* Tag Circle */}
            <View
              style={[
                styles.tagContainer,
                {
                  left: `${x_position}%`,
                  top: `${y_position}%`,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.tag}
                onPress={() => onTagPress && onTagPress(outfitArticle)}
                disabled={!onTagPress}
              >
                <Ionicons name="checkmark" size={14} color={colors.ink} />
              </TouchableOpacity>
            </View>

            {/* Tag Card */}
            {renderTagCard(outfitArticle)}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    pointerEvents: 'box-none',
  },
  tagContainer: {
    position: 'absolute',
    width: 30,
    height: 30,
    // Center the tag on the exact coordinate point
    transform: [{ translateX: -15 }, { translateY: -15 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'auto',
  },
  tag: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: colors.ink,
    ...shadows.soft,
  },
  tagCard: {
    position: 'absolute',
    backgroundColor: colors.overlayMute,
    borderRadius: radius.card,
    minWidth: 140,
    maxWidth: 200,
    zIndex: 200,
    ...shadows.float,
  },
  tagCardContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s10,
  },
  tagCardTitle: {
    color: colors.onDark,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  tagCardPrice: {
    color: colors.tag,
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
  tagCardArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.overlayMute,
  },
  tagCardArrowLeft: {
    left: 10,
  },
  tagCardArrowRight: {
    right: 10,
  },
  tagCardArrowTop: {
    bottom: -8,
    transform: [{ rotate: '0deg' }],
  },
  tagCardArrowBottom: {
    top: -8,
    transform: [{ rotate: '180deg' }],
  },
});
