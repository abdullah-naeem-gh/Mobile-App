import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Article } from '../types';
import { getImageDimensions, calculateOptimalDimensions } from '../lib/imageUtils';

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
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
  const imageOpacity = useState(new Animated.Value(0))[0];

  // Process image URL with cache busting parameter
  const imageUrl = useMemo(() => {
    if (!article.image_urls || article.image_urls.length === 0) return null;
    
    const baseUrl = article.image_urls[0];
    if (!baseUrl) return null;
    
    // Add a cache-busting timestamp parameter
    const separator = baseUrl.includes('?') ? '&' : '?';
    // Use article ID as part of the cache key for more consistent caching
    return `${baseUrl}${separator}_imgcache=${article.id.substring(0, 8)}`;
  }, [article.image_urls, article.id]);

  // Load image dimensions when component mounts
  useEffect(() => {
    if (imageUrl) {
      loadImageDimensions();
    }
  }, [imageUrl]);

  const loadImageDimensions = async () => {
    if (!imageUrl) return;
    
    try {
      const dimensions = await getImageDimensions(imageUrl, {
        maxRetries: 3,
        retryDelay: 1500,
        timeout: 8000,
        cacheBuster: true
      });
      const screenWidth = width; // Full screen width
      const optimalDimensions = calculateOptimalDimensions(
        dimensions.width,
        dimensions.height,
        screenWidth,
        screenWidth * 1.2, // maxHeight - allow up to 1.2x screen width
        screenWidth * 0.6   // minHeight - minimum 0.6x screen width
      );
      
      setImageDimensions(optimalDimensions);
    } catch (error) {
      console.error('Failed to get image dimensions for article:', article.id, error);
      // Fallback to a more reasonable default for articles
      setImageDimensions({
        width: width,
        height: width * 0.75, // 4:3 aspect ratio fallback
        aspectRatio: 4/3
      });
    }
  };

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
        <View style={[
          styles.imageContainer,
          imageDimensions ? {
            height: imageDimensions.height,
          } : { height: width } // Fallback to square
        ]}>
          {imageLoading && imageUrl && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="large" color="#666666" />
            </View>
          )}
          {!imageUrl || imageError ? (
            <View style={styles.imageErrorContainer}>
              <Icon name="image-outline" size={40} color="#333333" />
              <Text style={styles.imageErrorText}>
                {!imageUrl ? 'No image available' : 'Failed to load image'}
              </Text>
            </View>
          ) : (
            <Animated.View style={{ opacity: imageOpacity, width: '100%', height: '100%' }}>
              <Image
                source={{ uri: imageUrl }}
                style={[
                  styles.articleImage,
                  imageDimensions ? {
                    height: imageDimensions.height,
                    aspectRatio: imageDimensions.aspectRatio,
                  } : { width: '100%', height: '100%' }
                ]}
                onLoad={() => {
                  setImageLoading(false);
                  Animated.timing(imageOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }}
                onError={() => {
                  console.log('Image load error for:', imageUrl);
                  setImageLoading(false);
                  setImageError(true);
                }}
                resizeMode="cover"
              />
            </Animated.View>
          )}
          
          {/* Aspect ratio indicator */}
          {imageDimensions && (
            <View style={styles.aspectRatioIndicator}>
              <Text style={styles.aspectRatioText}>
                {Math.round(imageDimensions.aspectRatio * 100) / 100}:1
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Icon 
              name={article.is_liked ? "heart" : "heart-outline"} 
              size={26} 
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
            color={article.is_saved ? "#4CAF50" : "#ffffff"} 
          />
        </TouchableOpacity>
      </View>

      {/* Article Info */}
      <View style={styles.infoSection}>
        <Text style={styles.likesCount}>
          {article.likes_count.toLocaleString()} {article.likes_count === 1 ? 'like' : 'likes'}
        </Text>
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
            {article.currency} {article.price?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.savesCount}>
            {article.saves_count.toLocaleString()} {article.saves_count === 1 ? 'save' : 'saves'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    marginBottom: 20, // Add space between cards
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 8,
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
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: width * 0.6, // Minimum height for wide images
    maxHeight: width * 1.2, // Maximum height for tall images
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
    backgroundColor: '#111111',
  },
  imageErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#111111',
  },
  imageErrorText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  aspectRatioIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  aspectRatioText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
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
