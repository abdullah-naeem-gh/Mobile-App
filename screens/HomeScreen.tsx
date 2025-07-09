import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  Animated,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { ArticleCard } from '../components/ArticleCard';
import { FiltersModal } from '../components/FiltersModal';
import { Article, CategoryType, GenderType } from '../types';
import { articleService, ArticleFilters } from '../services/articleService';
import { useNavigation } from '@react-navigation/native';
import { preloadImages } from '../lib/imageUtils';

const { width, height } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ArticleFilters>({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadArticles = useCallback(async (
    currentPage: number = 0, 
    currentFilters: ArticleFilters = filters,
    reset: boolean = false
  ) => {
    if (loading && !reset) return;
    
    setLoading(true);
    
    const { data, error } = await articleService.getArticles(currentFilters, currentPage);
    
    if (error) {
      Alert.alert('Error', error);
    } else {
      const articles = data || []; // Handle undefined data
      if (reset || currentPage === 0) {
        setArticles(articles);
      } else {
        setArticles(prev => [...prev, ...articles]);
      }
      setHasMore(articles.length === 20); // Assuming limit is 20
    }
    
    setLoading(false);
  }, [filters, loading]);

  useEffect(() => {
    loadArticles(0, filters, true);
    setPage(0);
  }, [filters]);

  // Add preloading logic for images when articles load
  useEffect(() => {
    if (articles.length > 0) {
      // Preload first few images for better UX
      const imageUrls = articles
        .slice(0, 5) // First 5 articles
        .map(article => article.image_urls?.[0])
        .filter(Boolean) as string[];
      
      // Also preload brand logos
      const brandLogoUrls = articles
        .slice(0, 5)
        .map(article => article.brand?.logo_url)
        .filter(Boolean) as string[];
      
      preloadImages([...imageUrls, ...brandLogoUrls]);
    }
  }, [articles]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
    
    // Calculate current index based on scroll position
    const index = Math.round(offsetY / height);
    if (index !== currentIndex && index >= 0 && index < articles.length) {
      setCurrentIndex(index);
    }
  }, [currentIndex, articles.length]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: height,
    offset: height * index,
    index,
  }), []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  }, [currentIndex]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60, // Reduced for smoother transitions
    minimumViewTime: 200, // Increased for more stability
  };

  // Add momentum-based smooth scrolling
  const handleMomentumScrollEnd = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / height);
    
    // Ensure we're properly snapped to a card with gentler correction
    if (Math.abs(offsetY - (index * height)) > 20) {
      flatListRef.current?.scrollToOffset({
        offset: index * height,
        animated: true,
      });
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadArticles(0, filters, true);
    setPage(0);
    setRefreshing(false);
  }, [loadArticles, filters]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadArticles(nextPage, filters, false);
    }
  }, [hasMore, loading, page, loadArticles, filters]);

  const handleApplyFilters = useCallback((newFilters: ArticleFilters) => {
    setFilters(newFilters);
    setPage(0);
    loadArticles(0, newFilters, true);
  }, [loadArticles]);

  const hasActiveFilters = filters.search || filters.gender || filters.category || 
                          (filters.colors && filters.colors.length > 0) || 
                          (filters.sizes && filters.sizes.length > 0) ||
                          filters.priceRange;

  const handleLikeChange = async (articleId: string, isLiked: boolean) => {
    // Optimistically update UI
    setArticles(prev =>
      prev.map(article =>
        article.id === articleId
          ? {
              ...article,
              is_liked: isLiked,
              likes_count: article.likes_count + (isLiked ? 1 : -1),
            }
          : article
      )
    );

    // Make API call
    const result = await articleService.toggleLike(articleId);

    if (!result.success) {
      // Revert optimistic update on failure
      setArticles(prev =>
        prev.map(article =>
          article.id === articleId
            ? {
                ...article,
                is_liked: !isLiked,
                likes_count: article.likes_count + (isLiked ? -1 : 1),
              }
            : article
        )
      );
      Alert.alert('Error', result.error || 'Failed to update like');
    }
  };

  const handleSaveChange = async (articleId: string, isSaved: boolean) => {
    // Optimistically update UI
    setArticles(prev =>
      prev.map(article =>
        article.id === articleId
          ? {
              ...article,
              is_saved: isSaved,
              saves_count: article.saves_count + (isSaved ? 1 : -1),
            }
          : article
      )
    );

    // Make API call
    const result = await articleService.toggleSave(articleId);

    if (!result.success) {
      // Revert optimistic update on failure
      setArticles(prev =>
        prev.map(article =>
          article.id === articleId
            ? {
                ...article,
                is_saved: !isSaved,
                saves_count: article.saves_count + (isSaved ? -1 : 1),
              }
            : article
        )
      );
      Alert.alert('Error', result.error || 'Failed to update save');
    }
  };

  const handleExternalLink = (article: Article) => {
    if (article.purchase_url) {
      console.log('Opening URL directly in external browser:', article.purchase_url);
      Linking.openURL(article.purchase_url).catch(err => {
        console.error('Failed to open URL in external browser:', err);
        Alert.alert('Error', 'Unable to open the link. Please try again later.');
      });
    } else {
      Alert.alert(
        article.title,
        `Brand: ${article.brand?.name}\nPrice: ${article.currency} ${article.price}\n\n${article.description}`,
        [{ text: 'Close', style: 'cancel' }]
      );
    }
  };

  const renderArticle = ({ item, index }: { item: Article; index: number }) => {
    const inputRange = [
      (index - 1) * height,
      index * height,
      (index + 1) * height,
    ];

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.95, 1, 0.95], // Much more subtle scaling
      extrapolate: 'clamp',
    });

    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8], // More subtle opacity change
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.articleContainer,
          {
            opacity,
            transform: [{ scale }],
          }
        ]}
      >
        <ArticleCard
          article={item}
          onLikeChange={handleLikeChange}
          onSaveChange={handleSaveChange}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Platform-specific status bar */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      {/* Static beige background for consistency */}
      <View style={styles.beigeBackground} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={[styles.iconButton, hasActiveFilters && styles.activeFilterIcon]}
              onPress={() => setShowFiltersModal(true)}
            >
              <Icon 
                name="options-outline" 
                size={20} 
                color={hasActiveFilters ? '#ffffff' : '#000000'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate={Platform.OS === 'ios' ? 0.95 : 'fast'} // Platform-specific deceleration
          bounces={false}
          bouncesZoom={false}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { 
              useNativeDriver: false,
              listener: handleScroll,
            }
          )}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16} // Increased for smoother transitions
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={1}
          windowSize={2}
          initialNumToRender={1}
          updateCellsBatchingPeriod={100}
          disableIntervalMomentum={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No articles found</Text>
              <Text style={styles.emptySubText}>Try adjusting your filters</Text>
            </View>
          }
        />
        
        <FiltersModal
          visible={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          onApplyFilters={handleApplyFilters}
          currentFilters={filters}
        />
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
    height: Platform.OS === 'ios' ? 670 : 630, // Reduced height to match design - just covers header area
    backgroundColor: '#E8D5C4', // Consistent beige color
    borderBottomLeftRadius: 43,
    borderBottomRightRadius: 43,
    opacity: 0.95,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2000, // Higher z-index to stay above cards
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 50, // Adjust for status bar
    paddingBottom: 15,
    backgroundColor: 'rgba(232, 213, 196, 0.95)', // Semi-transparent beige
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  logo: {
    width: width * 0.55, // Responsive width (roughly 220px on most phones)
    height: width * 0.18, // Responsive height (roughly 72px on most phones)
    maxWidth: 220,
    maxHeight: 72,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginRight: 10,
    borderRadius: 16,
  },
  filterIcon: {
    fontSize: 20,
    color: '#000000',
  },
  activeFilterIcon: {
    backgroundColor: '#000000',
    borderRadius: 16,
  },
  activeFilterIconText: {
    color: '#ffffff',
  },
  articleContainer: {
    height: height,
    justifyContent: 'flex-start', // Change to flex-start for manual positioning
    alignItems: 'center',
    paddingTop: 0, // Remove padding as we're handling it in ArticleCard
    paddingHorizontal: 0, // Remove horizontal padding to match design
  },
  listContainer: {
    flexGrow: 1,
    // No additional padding - cards start right after header
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height - 200, // Adjust for header
    paddingTop: 0, // Remove platform-specific padding
  },
  emptyText: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666666',
  },
});
