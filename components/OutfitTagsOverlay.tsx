import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OutfitArticle {
  x_position: number;
  y_position: number;
  articles: {
    id: string;
    title: string;
    price?: number;
    currency?: string;
    image_urls?: string[];
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
    
    // Position cards exactly like OutfitTagger does
    const isLeft = x_position > 50;
    const isTop = y_position > 50;

    return (
      <View
        key={`card-${articles.id}`}
        style={[
          styles.tagCard,
          {
            // Position the card using absolute positioning very close to the tag
            position: 'absolute',
            // Position card directly next to the tag with minimal offset
            left: isLeft ? undefined : `${x_position + 2}%`, // Reduced offset to 2%
            right: isLeft ? `${100 - x_position + 2}%` : undefined, // Reduced offset to 2%
            top: isTop ? undefined : `${y_position + 2}%`, // Reduced offset to 2%
            bottom: isTop ? `${100 - y_position + 2}%` : undefined, // Reduced offset to 2%
          } as ViewStyle,
        ]}
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
      </View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Render tags */}
      {outfitArticles.map((outfitArticle, index) => {
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
                <Ionicons
                  name="checkmark"
                  size={14}
                  color="#000"
                />
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
    backgroundColor: '#E8D5C4', // Beige background to match theme
    borderWidth: 2, // Thinner border
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 10,
  },
  tagCard: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.95)', // Slightly more opaque
    borderRadius: 12, // Slightly larger radius
    minWidth: 140, // Slightly wider
    maxWidth: 200,
    zIndex: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  tagCardContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tagCardTitle: {
    color: '#fff',
    fontSize: 14, // Slightly larger text
    fontWeight: '700', // Bolder weight
    marginBottom: 6,
    lineHeight: 18,
  },
  tagCardPrice: {
    color: '#E8D5C4', // Beige color to match theme
    fontSize: 12,
    fontWeight: '600',
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
    borderTopColor: 'rgba(0, 0, 0, 0.95)',
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
