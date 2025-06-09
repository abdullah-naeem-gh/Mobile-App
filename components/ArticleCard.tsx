import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import { Article } from '../types';
import { articleService } from '../services/articleService';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding

interface ArticleCardProps {
  article: Article;
  onPress?: (article: Article) => void;
  onLikeChange?: (articleId: string, isLiked: boolean) => void;
  onSaveChange?: (articleId: string, isSaved: boolean) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onPress,
  onLikeChange,
  onSaveChange,
}) => {
  const handleLike = async () => {
    const result = await articleService.toggleLike(article.id);
    if (result.success) {
      onLikeChange?.(article.id, !article.is_liked);
    }
  };

  const handleSave = async () => {
    const result = await articleService.toggleSave(article.id);
    if (result.success) {
      onSaveChange?.(article.id, !article.is_saved);
    }
  };

  const handlePurchase = () => {
    if (article.purchase_url) {
      Linking.openURL(article.purchase_url);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(article)}>
      <View style={styles.imageContainer}>
        {article.image_urls?.[0] && (
          <Image source={{ uri: article.image_urls[0] }} style={styles.image} />
        )}
        <View style={styles.overlay}>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
              <Text style={styles.actionIcon}>{article.is_saved ? '🔖' : '📑'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bottomActions}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <Text style={styles.actionIcon}>{article.is_liked ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.brand} numberOfLines={1}>
          {article.brand?.name}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {article.price ? `${article.currency} ${article.price}` : 'Price on request'}
          </Text>
          {article.purchase_url && (
            <TouchableOpacity onPress={handlePurchase} style={styles.buyButton}>
              <Text style={styles.buyText}>Buy</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.stats}>
          <Text style={styles.statText}>❤️ {article.likes_count}</Text>
          <Text style={styles.statText}>🔖 {article.saves_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: '#111111',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: cardWidth * 1.2,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222222',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 8,
  },
  topActions: {
    alignItems: 'flex-end',
  },
  bottomActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  content: {
    padding: 12,
  },
  brand: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  buyButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  buyText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: '#666666',
  },
});
