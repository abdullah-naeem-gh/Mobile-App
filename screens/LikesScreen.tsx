import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { likesService, LikedItem } from '../services/likesService';

const { width } = Dimensions.get('window');

interface LikesScreenProps {
  onBack: () => void;
}

export const LikesScreen: React.FC<LikesScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [likedItems, setLikedItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'articles' | 'outfits'>('all');
  // Add state for image loading that will be used by all grid items
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadLikedItems();
  }, [user]);

  // Initialize loading states whenever liked items change
  useEffect(() => {
    if (likedItems && likedItems.length > 0) {
      const newLoadingStates: {[key: string]: boolean} = {};
      likedItems.forEach(item => {
        if (imageLoadingStates[item.id] === undefined) {
          newLoadingStates[item.id] = true;
        }
      });
      
      if (Object.keys(newLoadingStates).length > 0) {
        setImageLoadingStates(prev => ({
          ...prev,
          ...newLoadingStates
        }));
      }
    }
  }, [likedItems]);

  const loadLikedItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await likesService.getLikedItems(user.id);
      
      if (result.success && result.data) {
        setLikedItems(result.data);
      } else {
        console.error('Error loading liked items:', result.error);
        Alert.alert('Error', 'Failed to load liked items');
      }
    } catch (error) {
      console.error('Error loading liked items:', error);
      Alert.alert('Error', 'Failed to load liked items');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLikedItems();
    setRefreshing(false);
  };

  const handleUnlike = async (likeId: string) => {
    try {
      const result = await likesService.removeLike(likeId);
      
      if (result.success) {
        setLikedItems(items => items.filter(item => item.id !== likeId));
      } else {
        console.error('Error removing like:', result.error);
        Alert.alert('Error', 'Failed to remove item from liked');
      }
    } catch (error) {
      console.error('Error removing like:', error);
      Alert.alert('Error', 'Failed to remove item from liked');
    }
  };

  const getFilteredItems = () => {
    switch (selectedTab) {
      case 'articles':
        return likedItems.filter(item => item.articles);
      case 'outfits':
        return likedItems.filter(item => item.outfits);
      default:
        return likedItems;
    }
  };

  const handleImageLoaded = (itemId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [itemId]: false
    }));
  };

  const renderGridItem = ({ item }: { item: LikedItem }) => {
    const isArticle = !!item.articles;
    const imageUrl = isArticle 
      ? (item.articles?.image_urls && item.articles.image_urls.length > 0 ? item.articles.image_urls[0] : null)
      : item.outfits?.image_url;
    
    const imageId = item.id;
    const isImageLoading = imageLoadingStates[imageId] !== false;
    
    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        {imageUrl ? (
          <>
            {isImageLoading && (
              <View style={styles.gridImageLoading}>
                <ActivityIndicator size="small" color="#666666" />
              </View>
            )}
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.gridImage}
              resizeMode="cover"
              onLoad={() => handleImageLoaded(imageId)}
              onError={() => handleImageLoaded(imageId)}
            />
          </>
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Text style={styles.gridImagePlaceholderText}>No Image</Text>
          </View>
        )}
        
        {isArticle && item.articles?.price && !isImageLoading && (
          <View style={styles.priceOverlay}>
            <Text style={styles.priceText}>
              {item.articles.currency || 'PKR'} {item.articles.price}
            </Text>
          </View>
        )}
        
        <View style={styles.likeIconOverlay}>
          <Text style={styles.likeIcon}>❤️</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleItemPress = (item: LikedItem) => {
    const isArticle = !!item.articles;
    const title = isArticle ? item.articles?.title : item.outfits?.title;
    const creator = isArticle ? item.articles?.brands?.name : item.outfits?.users?.username;
    
    Alert.alert(
      isArticle ? 'Liked Article' : 'Liked Outfit',
      `${title || 'Untitled'}\nBy: ${creator || 'Unknown'}\n\nLiked: ${new Date(item.created_at).toLocaleDateString()}`,
      [
        { text: 'View Details', onPress: () => {
          console.log(`Navigate to ${isArticle ? 'article' : 'outfit'} details:`, isArticle ? item.articles?.id : item.outfits?.id);
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleLongPress = (item: LikedItem) => {
    const isArticle = !!item.articles;
    const title = isArticle ? item.articles?.title : item.outfits?.title;
    
    Alert.alert(
      'Remove from Liked',
      `Remove "${title || 'Untitled'}" from your liked items?`,
      [
        { text: 'Remove', style: 'destructive', onPress: () => handleUnlike(item.id) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Liked</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading liked items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All ({likedItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'articles' && styles.activeTab]}
          onPress={() => setSelectedTab('articles')}
        >
          <Text style={[styles.tabText, selectedTab === 'articles' && styles.activeTabText]}>
            Articles ({likedItems.filter(item => item.articles).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'outfits' && styles.activeTab]}
          onPress={() => setSelectedTab('outfits')}
        >
          <Text style={[styles.tabText, selectedTab === 'outfits' && styles.activeTabText]}>
            Outfits ({likedItems.filter(item => item.outfits).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Grid */}
      <View style={styles.content}>
        {getFilteredItems().length > 0 ? (
          <FlatList
            data={getFilteredItems()}
            renderItem={renderGridItem}
            numColumns={3}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={getFilteredItems().length > 0 ? styles.gridRow : undefined}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#ffffff"
                colors={["#ffffff"]}
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>No liked items</Text>
            <Text style={styles.emptySubtitle}>
              Items you like will appear here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#ffffff',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 50) / 3,
    aspectRatio: 1,
    marginBottom: 2,
    marginHorizontal: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#111111',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
    zIndex: 1,
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridImagePlaceholderText: {
    color: '#666666',
    fontSize: 10,
    textAlign: 'center',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  likeIconOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeIcon: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
