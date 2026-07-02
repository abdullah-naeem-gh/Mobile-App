import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

interface SavedItem {
  id: string;
  created_at: string;
  articles?: {
    id: string;
    title: string;
    image_urls: string[];
    price: number;
    currency: string;
    brands: {
      name: string;
    };
  } | null;
  outfits?: {
    id: string;
    title: string;
    image_url: string;
    users: {
      username: string;
    };
  } | null;
}

interface SavedScreenProps {
  onBack: () => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'articles' | 'outfits'>('all');
  // Add state for image loading that will be used by all grid items
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadSavedItems();
  }, [user]);

  // Initialize loading states whenever saved items change
  useEffect(() => {
    if (savedItems && savedItems.length > 0) {
      const newLoadingStates: {[key: string]: boolean} = {};
      savedItems.forEach(item => {
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
  }, [savedItems]);

  const loadSavedItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saves')
        .select(`
          id,
          created_at,
          article_id,
          outfit_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading saved items:', error);
        Alert.alert('Error', 'Failed to load saved items');
        return;
      }

      const savedItemsWithDetails = await Promise.all(
        (data || []).map(async (save) => {
          const savedItem: SavedItem = {
            id: save.id,
            created_at: save.created_at,
            articles: null,
            outfits: null,
          };

          if (save.article_id) {
            const { data: articleData } = await supabase
              .from('articles')
              .select(`
                id,
                title,
                image_urls,
                price,
                currency,
                brands!articles_brand_id_fkey (
                  name
                )
              `)
              .eq('id', save.article_id)
              .single();

            if (articleData) {
              savedItem.articles = {
                id: articleData.id,
                title: articleData.title,
                image_urls: articleData.image_urls,
                price: articleData.price,
                currency: articleData.currency,
                brands: Array.isArray(articleData.brands) ? articleData.brands[0] : articleData.brands,
              };
            }
          }

          if (save.outfit_id) {
            const { data: outfitData } = await supabase
              .from('outfits')
              .select(`
                id,
                title,
                image_url,
                users!outfits_user_id_fkey (
                  username
                )
              `)
              .eq('id', save.outfit_id)
              .single();

            if (outfitData) {
              savedItem.outfits = {
                id: outfitData.id,
                title: outfitData.title,
                image_url: outfitData.image_url,
                users: Array.isArray(outfitData.users) ? outfitData.users[0] : outfitData.users,
              };
            }
          }

          return savedItem;
        })
      );

      setSavedItems(savedItemsWithDetails);
    } catch (error) {
      console.error('Error loading saved items:', error);
      Alert.alert('Error', 'Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedItems();
    setRefreshing(false);
  };

  const handleUnsave = async (saveId: string) => {
    try {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('id', saveId);

      if (error) {
        console.error('Error removing save:', error);
        Alert.alert('Error', 'Failed to remove item from saved');
      } else {
        setSavedItems(items => items.filter(item => item.id !== saveId));
      }
    } catch (error) {
      console.error('Error removing save:', error);
      Alert.alert('Error', 'Failed to remove item from saved');
    }
  };

  const getFilteredItems = () => {
    switch (selectedTab) {
      case 'articles':
        return savedItems.filter(item => item.articles);
      case 'outfits':
        return savedItems.filter(item => item.outfits);
      default:
        return savedItems;
    }
  };

  const handleImageLoaded = (itemId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [itemId]: false
    }));
  };

  const renderGridItem = ({ item }: { item: SavedItem }) => {
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
        
        <View style={styles.saveIconOverlay}>
          <Icon name="bookmark" size={12} color="#E8A853" />
        </View>
      </TouchableOpacity>
    );
  };

  const handleItemPress = (item: SavedItem) => {
    const isArticle = !!item.articles;
    const title = isArticle ? item.articles?.title : item.outfits?.title;
    const creator = isArticle ? item.articles?.brands?.name : item.outfits?.users?.username;
    
    Alert.alert(
      isArticle ? 'Saved Article' : 'Saved Outfit',
      `${title || 'Untitled'}\nBy: ${creator || 'Unknown'}\n\nSaved: ${new Date(item.created_at).toLocaleDateString()}`,
      [
        { text: 'View Details', onPress: () => {
          console.log(`Navigate to ${isArticle ? 'article' : 'outfit'} details:`, isArticle ? item.articles?.id : item.outfits?.id);
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleLongPress = (item: SavedItem) => {
    const isArticle = !!item.articles;
    const title = isArticle ? item.articles?.title : item.outfits?.title;
    
    Alert.alert(
      'Remove from Saved',
      `Remove "${title || 'Untitled'}" from your saved items?`,
      [
        { text: 'Remove', style: 'destructive', onPress: () => handleUnsave(item.id) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Platform-specific status bar */}
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#E8D5C4" 
          translucent={Platform.OS === 'android'}
        />
        
        <View style={styles.beigeBackground} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Saved Items</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading saved items...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Platform-specific status bar */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#E8D5C4" 
        translucent={Platform.OS === 'android'}
      />
      
      <View style={styles.beigeBackground} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Items</Text>
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
                name="bookmark" 
                size={16} 
                color={selectedTab === 'all' ? '#000000' : '#666666'} 
              />
              <Text style={[styles.contentTabText, selectedTab === 'all' && styles.activeContentTabText]}>
                All ({savedItems.length})
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
                Articles ({savedItems.filter(item => item.articles).length})
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
                Outfits ({savedItems.filter(item => item.outfits).length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Card */}
          <View style={styles.contentCard}>
            <Text style={styles.contentCardTitle}>
              {selectedTab === 'all' ? 'All Saved Items' : 
               selectedTab === 'articles' ? 'Saved Articles' : 'Saved Outfits'}
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
                  <Icon name="bookmark-outline" size={32} color="#666666" />
                </View>
                <Text style={styles.emptyContentTitle}>No saved items</Text>
                <Text style={styles.emptyContentSubtitle}>
                  Items you save will appear here. Start exploring and save items for later!
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
    height: 200, // Increased from 180 for better coverage
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
    // Safe area inset is handled by SafeAreaView; this is just visual breathing room
    paddingTop: 12,
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
    paddingTop: 80,
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
  saveIconOverlay: {
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
  saveIcon: {
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
