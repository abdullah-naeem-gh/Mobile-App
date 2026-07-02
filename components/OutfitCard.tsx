import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { OutfitTagsOverlay } from './OutfitTagsOverlay';
import { PLATFORM_CONSTANTS } from '../utils/platformUtils';

const { width, height } = Dimensions.get('window');

// Fixed design dimensions for outfit cards
const DESIGN_WIDTH = 380;
const DESIGN_HEIGHT = 680;

// Calculate responsive card dimensions
const availableWidth = width * 0.85;
const scaleFactor = Math.min(availableWidth / DESIGN_WIDTH, 1.2);
const cardWidth = DESIGN_WIDTH * scaleFactor;
const cardHeight = DESIGN_HEIGHT * scaleFactor;

interface User {
  id: string;
  username: string;
  profile_image_url?: string;
}

interface Outfit {
  id: string;
  image_urls: string[];
  description?: string;
  user: User;
  likes_count: number;
  saves_count: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  outfit_articles?: {
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
  }[];
}

interface OutfitCardProps {
  outfit: Outfit;
  onPress: (outfit: Outfit) => void;
  onLikeChange: (outfitId: string, isLiked: boolean) => void;
  onSaveChange: (outfitId: string, isSaved: boolean) => void;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  onPress,
  onLikeChange,
  onSaveChange,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showArticles, setShowArticles] = useState(false);
  const imageOpacity = useState(new Animated.Value(0))[0];

  // Process image URL with cache busting parameter
  const imageUrl = useMemo(() => {
    if (!outfit.image_urls || outfit.image_urls.length === 0) return null;
    
    const baseUrl = outfit.image_urls[0];
    if (!baseUrl) return null;
    
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}_imgcache=${outfit.id.substring(0, 8)}`;
  }, [outfit.image_urls, outfit.id]);

  const handleLike = () => {
    onLikeChange(outfit.id, !outfit.is_liked);
  };

  const handleSave = () => {
    onSaveChange(outfit.id, !outfit.is_saved);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const formatTimestamp = () => {
    // Simple timestamp formatting - you can make this more sophisticated
    return '2h ago';
  };

  const handleArticleClick = (article: any) => {
    console.log('=== Article clicked ===');
    console.log('Article:', article);
    console.log('Purchase URL:', article.purchase_url);
    
    if (article.purchase_url) {
      console.log('Opening URL directly in external browser:', article.purchase_url);
      Linking.openURL(article.purchase_url).catch(err => {
        console.error('Failed to open URL in external browser:', err);
        Alert.alert('Error', 'Unable to open the link. Please try again later.');
      });
    } else {
      console.log('No purchase URL available for article:', article.title);
      Alert.alert(
        'No Purchase Link',
        'This article doesn\'t have a purchase link available.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContent}>
        {/* Outfit Image with overlay info */}
        <TouchableOpacity onPress={() => onPress(outfit)} activeOpacity={0.8}>
          <View style={styles.imageContainer}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton}>
              <Icon name="close" size={20} color="#000000" />
            </TouchableOpacity>
            
            {/* Like button */}
            <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
              <Icon 
                name={outfit.is_liked ? "heart" : "heart-outline"} 
                size={24} 
                color={outfit.is_liked ? "#ff3040" : "#000000"} 
              />
              <Text style={styles.likeCount}>{outfit.likes_count || 0}</Text>
            </TouchableOpacity>

            {/* Loading state */}
            {imageLoading && imageUrl && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color="#666666" />
              </View>
            )}

            {/* Error state */}
            {!imageUrl || imageError ? (
              <View style={styles.imageErrorContainer}>
                <Icon name="image-outline" size={40} color="#666666" />
                <Text style={styles.imageErrorText}>
                  {!imageUrl ? 'No image available' : 'Failed to load image'}
                </Text>
              </View>
            ) : (
              <Animated.Image
                source={{ uri: imageUrl }}
                style={[styles.outfitImage, { opacity: imageOpacity }]}
                onLoad={handleImageLoad}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                resizeMode="cover"
              />
            )}

            {/* Outfit Tags Overlay */}
            {!imageLoading && outfit.outfit_articles && outfit.outfit_articles.length > 0 && showArticles && (
              <OutfitTagsOverlay 
                outfitArticles={outfit.outfit_articles}
                showCards={true}
                onTagPress={(article) => {
                  handleArticleClick(article.articles);
                }}
              />
            )}

            {/* Gradient overlay with user info */}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.overlayInfo}
            >
              <View style={styles.userInfoRow}>
                <View style={styles.userInfo}>
                  <View style={styles.userImageContainer}>
                    {outfit.user?.profile_image_url ? (
                      <Image 
                        source={{ uri: outfit.user.profile_image_url }} 
                        style={styles.userImage}
                        onError={() => {}}
                      />
                    ) : (
                      <View style={styles.userImagePlaceholder}>
                        <Text style={styles.userInitial}>
                          {outfit.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.username}>{outfit.user?.username || 'Unknown User'}</Text>
                    <Text style={styles.timestamp}>{formatTimestamp()}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleSave} style={styles.saveButtonOverlay}>
                  <Icon 
                    name={outfit.is_saved ? "bookmark" : "bookmark-outline"} 
                    size={24} 
                    color="#ffffff" 
                  />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <View style={styles.actionRow}>
            <Text style={styles.savesCount}>{outfit.saves_count} saves</Text>
            {outfit.outfit_articles && outfit.outfit_articles.length > 0 && (
              <TouchableOpacity 
                onPress={() => setShowArticles(!showArticles)} 
                style={styles.showArticlesButton}
              >
                <Text style={styles.showArticlesText}>
                  {showArticles ? 'Hide articles' : 'Show articles'}
                </Text>
                <Icon 
                  name={showArticles ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#666666" 
                />
              </TouchableOpacity>
            )}
          </View>
          
          {outfit.description && (
            <Text style={styles.description} numberOfLines={2}>
              {outfit.description}
            </Text>
          )}
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
    paddingHorizontal: 10,
    paddingVertical: 0,
    justifyContent: 'flex-start',
  },
  cardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    ...PLATFORM_CONSTANTS.SHADOW_PROPS,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 21,
    elevation: 20,
    width: cardWidth,
    height: cardHeight,
    alignSelf: 'center',
    marginTop: PLATFORM_CONSTANTS.OUTFIT_CARD_MARGIN_TOP, // Use outfit-specific positioning
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: cardHeight * 0.8, // Image takes 80% of card height
    backgroundColor: '#ffffff',
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
  outfitImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
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
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userImageContainer: {
    marginRight: 12,
  },
  userImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#333333',
  },
  userImagePlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  timestamp: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.8,
  },
  saveButtonOverlay: {
    marginLeft: 12,
  },
  bottomSection: {
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savesCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  showArticlesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  showArticlesText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  description: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
  },
});
