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
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Article } from '../types';
import { getImageDimensions, calculateOptimalDimensions } from '../lib/imageUtils';

const { width, height } = Dimensions.get('window');

// Fixed design dimensions - maintain exact aspect ratio
const DESIGN_WIDTH = 420; // Increased from 346
const DESIGN_HEIGHT = 760; // Increased from 588
const DESIGN_ASPECT_RATIO = DESIGN_WIDTH / DESIGN_HEIGHT;

// Calculate responsive card dimensions while maintaining design proportions
const availableWidth = width * 0.85; // Increased from 85% to 95% of screen width
const scaleFactor = Math.min(availableWidth / DESIGN_WIDTH, 1.2); // Allow scaling up to 1.2x beyond design size
const cardWidth = DESIGN_WIDTH * scaleFactor;
const cardHeight = DESIGN_HEIGHT * scaleFactor;

// Image container takes most of the card height (about 75% like in design)
const imageContainerHeight = cardHeight * 0.75;

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
  const [isArticleNameExpanded, setIsArticleNameExpanded] = useState(false);
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

  // Determine the best resize mode based on image dimensions
  const getResizeMode = (): 'cover' | 'contain' => {
    if (!imageDimensions) return 'contain';
    
    const imageAspectRatio = imageDimensions.aspectRatio;
    const containerAspectRatio = DESIGN_ASPECT_RATIO;
    
    // If image aspect ratio is close to container aspect ratio, use cover
    // Otherwise use contain for Instagram-like centering
    const aspectRatioDifference = Math.abs(imageAspectRatio - containerAspectRatio);
    
    return aspectRatioDifference < 0.3 ? 'cover' : 'contain';
  };

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

  const handleArticleNamePress = () => {
    setIsArticleNameExpanded(!isArticleNameExpanded);
  };

  const formatPrice = () => {
    return `${article.currency} ${article.price?.toLocaleString() || '0'}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContent}>
        {/* Article Image with overlay info */}
        <TouchableOpacity onPress={() => onPress(article)} activeOpacity={0.8}>
          <View style={styles.imageContainer}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton}>
              <Icon name="close" size={20} color="#000000" />
            </TouchableOpacity>
            
            {/* Like button */}
            <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
              <Icon 
                name={article.is_liked ? "heart" : "heart-outline"} 
                size={24} 
                color={article.is_liked ? "#ff3040" : "#000000"} 
              />
              <Text style={styles.likeCount}>{article.likes_count}</Text>
            </TouchableOpacity>

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
                  style={styles.articleImage}
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
                  resizeMode={getResizeMode()} // Dynamic resize mode based on image dimensions
                />
              </Animated.View>
            )}

            {/* Overlay with article info */}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']} // Strong blur effect: 80% to 30% to 0%
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.overlayInfo}
            >
              <TouchableOpacity onPress={handleArticleNamePress} activeOpacity={0.7} style={styles.articleTitleRow}>
                <Text 
                  style={[styles.articleName, { flex: 1, marginRight: 8 }]} 
                  numberOfLines={isArticleNameExpanded ? undefined : 1}
                  ellipsizeMode={isArticleNameExpanded ? undefined : 'tail'}
                >
                  {article.title}
                </Text>
                <Text style={styles.priceOverlay}>{formatPrice()}</Text>
              </TouchableOpacity>
              <Text style={styles.brandNameOverlay}>{article.brand?.name || 'Unknown Brand'}</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{article.category}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Icon 
                name={article.is_saved ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color="#000000" 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {article.description || 'No description available...'}
          </Text>
          
          <View style={styles.tagsRow}>
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{article.category}</Text>
              </View>
              {article.brand?.name && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{article.brand.name}</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity style={styles.visitButton} onPress={handleExternalLink}>
              <Text style={styles.visitButtonText}>Visit</Text>
              <Icon name="arrow-forward" size={14} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    width: width,
    height: height, // Full screen height for reel effect
    paddingHorizontal: 10, // Reduced padding to accommodate larger cards
    paddingVertical: 0,
    justifyContent: 'flex-start',
  },
  cardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10, // Spread effect
    },
    shadowOpacity: 0.4, // Increased opacity for better visibility
    shadowRadius: 21, // Blur effect
    elevation: 20, // Higher elevation for Android
    width: cardWidth, // Responsive width
    height: cardHeight, // Responsive height maintaining aspect ratio
    alignSelf: 'center',
    marginTop: 100, // Adjusted position for larger cards
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: cardHeight * 0.75, // Image takes 75% of card height
    backgroundColor: '#ffffff', // White background like Instagram
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  likeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 10,
  },
  likeCount: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  articleImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff', // White background for centering small images
  },
  imageLoadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  imageErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  imageErrorText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  overlayInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  articleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  priceOverlay: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  articleName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  brandNameOverlay: {
    color: '#ffffff',
    fontSize: 14,
  },
  bottomSection: {
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  description: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  tag: {
    backgroundColor: '#E8D5C4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tagText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '500',
  },
  visitButton: {
    backgroundColor: '#E8A853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  visitButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});
