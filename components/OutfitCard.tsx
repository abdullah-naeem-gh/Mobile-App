import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { OutfitTagsOverlay } from './OutfitTagsOverlay';

const { width } = Dimensions.get('window');

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

  // Get the first image URL from the array
  const imageUrl = outfit.image_urls && outfit.image_urls.length > 0 ? outfit.image_urls[0] : null;
  
  // Debug outfit articles  


  const handleLike = () => {
    onLikeChange(outfit.id, !outfit.is_liked);
  };

  const handleSave = () => {
    onSaveChange(outfit.id, !outfit.is_saved);
  };

  return (
    <View style={styles.container}>
      {/* User Header */}
      <View style={styles.header}>
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
            <Text style={styles.timestamp}>2h ago</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Outfit Image */}
      <TouchableOpacity onPress={() => onPress(outfit)} activeOpacity={0.8}>
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
            <>
              <Image
                source={{ uri: imageUrl }}
                style={styles.outfitImage}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                resizeMode="cover"
              />
              {/* Outfit Tags Overlay */}
              {!imageLoading && outfit.outfit_articles && outfit.outfit_articles.length > 0 && showArticles && (
                <OutfitTagsOverlay 
                  outfitArticles={outfit.outfit_articles}
                  showCards={true}
                  onTagPress={(article) => {
                    // Handle tag press - could navigate to article details
                  }}
                />
              )}
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Icon 
              name={outfit.is_liked ? "heart" : "heart-outline"} 
              size={24} 
              color={outfit.is_liked ? "#ff3040" : "#ffffff"} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.rightActions}>
          {outfit.outfit_articles && outfit.outfit_articles.length > 0 && (
            <TouchableOpacity onPress={() => setShowArticles(!showArticles)} style={styles.showArticlesButton}>
              <Text style={styles.showArticlesText}>
                {showArticles ? 'Hide articles' : 'Show articles'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
            <Icon 
              name={outfit.is_saved ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Outfit Info */}
      <View style={styles.infoSection}>
        <Text style={styles.likesCount}>{outfit.likes_count} likes</Text>
        {outfit.description && (
          <View style={styles.descriptionRow}>
            <Text style={styles.usernameInline}>{outfit.user?.username}</Text>
            <Text style={styles.description}> {outfit.description}</Text>
          </View>
        )}
        <Text style={styles.savesCount}>{outfit.saves_count} saves</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: '#666666',
    fontSize: 12,
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
    position: 'relative',
  },
  outfitImage: {
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
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  descriptionRow: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  usernameInline: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  savesCount: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },
  showArticlesContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  showArticlesButton: {
    marginRight: 15,
  },
  showArticlesText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  showArticlesIcon: {
    fontSize: 16,
  },
});
