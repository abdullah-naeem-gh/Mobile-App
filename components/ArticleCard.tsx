import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Article } from '../types';

const { width } = Dimensions.get('window');

interface ArticleCardProps {
  article: Article;
  onPress: (article: Article) => void;
  onLikeChange: (articleId: string, isLiked: boolean) => void;
  onSaveChange: (articleId: string, isSaved: boolean) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onPress,
  onLikeChange,
  onSaveChange,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Get the first image URL from the array
  const imageUrl = article.image_urls && article.image_urls.length > 0 ? article.image_urls[0] : null;

  const handleLike = () => {
    onLikeChange(article.id, !article.is_liked);
  };

  const handleSave = () => {
    onSaveChange(article.id, !article.is_saved);
  };

  const handleExternalLink = () => {
    if (article.purchase_url) {
      Linking.openURL(article.purchase_url).catch(() => {
        console.log('Could not open URL');
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.brandInfo}>
          <View style={styles.brandImageContainer}>
            {article.brand?.logo_url ? (
              <Image
                source={{ uri: article.brand.logo_url }}
                style={styles.brandImage}
                onError={() => {}}
              />
            ) : (
              <View style={styles.brandImagePlaceholder}>
                <Text style={styles.brandInitial}>
                  {article.brand?.name?.charAt(0)?.toUpperCase() || 'B'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.brandDetails}>
            <Text style={styles.brandName}>{article.brand?.name || 'Unknown Brand'}</Text>
            <Text style={styles.articleCategory}>{article.category}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Article Image */}
      <TouchableOpacity onPress={() => onPress(article)} activeOpacity={0.8}>
        <View style={styles.imageContainer}>
          {imageLoading && imageUrl && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="large" color="#666666" />
            </View>
          )}
          {!imageUrl || imageError ? (
            <View style={styles.imageErrorContainer}>
              <Text style={styles.imageErrorText}>
                {!imageUrl ? 'No image available' : 'Failed to load image'}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.articleImage}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Icon 
              name={article.is_liked ? "heart" : "heart-outline"} 
              size={24} 
              color={article.is_liked ? "#ff3040" : "#ffffff"} 
            />
          </TouchableOpacity>
          {article.purchase_url && (
            <TouchableOpacity onPress={handleExternalLink} style={styles.actionButton}>
              <Icon name="open-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
          <Icon 
            name={article.is_saved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>

      {/* Article Info */}
      <View style={styles.infoSection}>
        <Text style={styles.likesCount}>{article.likes_count} likes</Text>
        <View style={styles.titleRow}>
          <Text style={styles.brandNameInline}>{article.brand?.name}</Text>
          <Text style={styles.articleTitle}> {article.title}</Text>
        </View>
        {article.description && (
          <Text style={styles.description} numberOfLines={2}>
            {article.description}
          </Text>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {article.currency} {article.price}
          </Text>
          <Text style={styles.savesCount}>{article.saves_count} saves</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandImageContainer: {
    marginRight: 12,
  },
  brandImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#333333',
  },
  brandImagePlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  brandDetails: {
    flex: 1,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  articleCategory: {
    color: '#666666',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: 8,
  },
  moreIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  imageErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  imageErrorText: {
    color: '#666666',
    fontSize: 14,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 15,
  },
  actionIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  likedIcon: {
    color: '#ff3040',
  },
  savedIcon: {
    color: '#ffffff',
  },
  infoSection: {
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  likesCount: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  brandNameInline: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  articleTitle: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  description: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  savesCount: {
    color: '#666666',
    fontSize: 12,
  },
});
