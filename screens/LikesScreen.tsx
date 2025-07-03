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
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { likesService, LikedItem } from '../services/likesService';

const { width, height } = Dimensions.get('window');

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
          <Icon name="heart" size={12} color="#ff3040" />
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
      <View style={styles.container}>
        <View style={styles.beigeBackground} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Liked Items</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading liked items...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.beigeBackground} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Liked Items</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#000000"
              colors={["#000000"]}
            />
          }
        >
          {/* Content Selector Card */}
          <View style={styles.contentSelectorCard}>
            <TouchableOpacity
              style={[styles.contentTab, selectedTab === 'all' && styles.activeContentTab]}
              onPress={() => setSelectedTab('all')}
            >
              <Icon 
                name="heart" 
                size={16} 
                color={selectedTab === 'all' ? '#000000' : '#666666'} 
              />
              <Text style={[styles.contentTabText, selectedTab === 'all' && styles.activeContentTabText]}>
                All ({likedItems.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contentTab, selectedTab === 'articles' && styles.activeContentTab]}
              onPress={() => setSelectedTab('articles')}
            >
              <Icon 
                name="pricetag" 
                size={16} 
                color={selectedTab === 'articles' ? '#000000' : '#666666'} 
              />
              <Text style={[styles.contentTabText, selectedTab === 'articles' && styles.activeContentTabText]}>
                Articles ({likedItems.filter(item => item.articles).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contentTab, selectedTab === 'outfits' && styles.activeContentTab]}
              onPress={() => setSelectedTab('outfits')}
            >
              <Icon 
                name="shirt" 
                size={16} 
                color={selectedTab === 'outfits' ? '#000000' : '#666666'} 
              />
              <Text style={[styles.contentTabText, selectedTab === 'outfits' && styles.activeContentTabText]}>
                Outfits ({likedItems.filter(item => item.outfits).length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Card */}
          <View style={styles.contentCard}>
            <Text style={styles.contentCardTitle}>
              {selectedTab === 'all' ? 'All Liked Items' : 
               selectedTab === 'articles' ? 'Liked Articles' : 'Liked Outfits'}
            </Text>
            
            {getFilteredItems().length > 0 ? (
              <FlatList
                data={getFilteredItems()}
                renderItem={renderGridItem}
                numColumns={3}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.gridContainer}
                columnWrapperStyle={getFilteredItems().length > 0 ? styles.gridRow : undefined}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContentContainer}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="heart-outline" size={32} color="#666666" />
                </View>
                <Text style={styles.emptyContentTitle}>No liked items</Text>
                <Text style={styles.emptyContentSubtitle}>
                  Items you like will appear here. Start exploring and like items you love!
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  beigeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: '#E8D5C4',
    borderBottomLeftRadius: 43,
    borderBottomRightRadius: 43,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: '#000000',
    fontSize: 16,
    marginTop: 16,
  },
  contentSelectorCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  contentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  activeContentTab: {
    backgroundColor: '#E8D5C4',
  },
  contentTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 8,
  },
  activeContentTabText: {
    color: '#000000',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  contentCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  gridContainer: {
    paddingBottom: 0,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridItem: {
    width: (width - 80) / 3, // Account for card padding and gaps
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
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
    backgroundColor: '#f8f8f8',
    zIndex: 1,
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
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
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  likeIconOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  likeIcon: {
    fontSize: 12,
  },
  emptyContentContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyContentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyContentSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  bottomSpace: {
    height: 40,
  },
});
