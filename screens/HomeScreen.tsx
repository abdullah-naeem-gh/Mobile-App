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
  Animated,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { ArticleCard } from '../components/ArticleCard';
import { FiltersModal } from '../components/FiltersModal';
import { Article, CategoryType, GenderType } from '../types';
import { articleService, ArticleFilters } from '../services/articleService';
import { useNavigation } from '@react-navigation/native';
import { preloadImages } from '../lib/imageUtils';
import { getArticleBackgroundColor } from '../lib/colorUtils';

const { width, height } = Dimensions.get('window');

// Helper function to interpolate between two colors
const interpolateColor = (color1: string, color2: string, factor: number): string => {
  // Parse hex colors
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  // Return hex color
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

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
  const [currentBackgroundColor, setCurrentBackgroundColor] = useState('#E8D5C4');
  const [previousBackgroundColor, setPreviousBackgroundColor] = useState('#E8D5C4');
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const backgroundColorAnimValue = useRef(new Animated.Value(1)).current;
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetColorRef = useRef('#E8D5C4'); // Track the target color to prevent redundant transitions

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
    setCurrentArticleIndex(0); // Reset to first article when filters change
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

  // Update background color when articles change or current index changes
  useEffect(() => {
    const updateBackgroundColor = () => {
      if (articles.length > 0 && articles[currentArticleIndex]) {
        const currentArticle = articles[currentArticleIndex];
        console.log(`Updating background for article ${currentArticleIndex}:`, currentArticle.title);
        console.log('Article colors:', currentArticle.colors);
        
        try {
          // Use the article's color data directly
          const newColor = getArticleBackgroundColor(currentArticle.colors);
          console.log('Generated background color:', newColor);
          
          // Only update if color is different from what we're targeting
          if (newColor !== targetColorRef.current) {
            console.log(`Color transition: ${targetColorRef.current} -> ${newColor}`);
            
            // Update target color reference
            targetColorRef.current = newColor;
            
            // Set up proper color interpolation
            setPreviousBackgroundColor(currentBackgroundColor);
            setCurrentBackgroundColor(newColor);
            
            // Animate from 0 to 1 for smooth color interpolation
            backgroundColorAnimValue.setValue(0);
            Animated.timing(backgroundColorAnimValue, {
              toValue: 1,
              duration: 300,
              useNativeDriver: false,
            }).start();
          }
        } catch (error) {
          console.warn('Failed to generate background color:', error);
          setCurrentBackgroundColor('#E8D5C4'); // Fallback to default
        }
      }
    };

    updateBackgroundColor();
  }, [articles, currentArticleIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const index = Math.round(contentOffset.y / height);
    
    if (index !== currentArticleIndex && index >= 0 && index < articles.length) {
      console.log(`Scroll detected: changing from article ${currentArticleIndex} to ${index}`);
      
      // Clear existing timeout to prevent multiple rapid updates
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Update immediately for instant response
      setCurrentArticleIndex(index);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentArticleIndex(0); // Reset to first article on refresh
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
                          (filters.sizes && filters.sizes.length > 0);

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

  const handleArticlePress = (article: Article) => {
    // Find the index of the clicked article
    const articleIndex = articles.findIndex(a => a.id === article.id);
    
    // Navigate to full-screen view
    (navigation as any).navigate('FullScreenArticle', {
      articles,
      initialIndex: articleIndex,
    });
  };

  const handleExternalLink = (article: Article) => {
    if (article.purchase_url) {
      Alert.alert(
        'View Article',
        `Open ${article.title} on ${article.brand?.name || 'brand'} website?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open', 
            onPress: () => {
              Linking.openURL(article.purchase_url!).catch(() => {
                Alert.alert('Error', 'Could not open the website');
              });
            }
          }
        ]
      );
    } else {
      Alert.alert(
        article.title,
        `Brand: ${article.brand?.name}\nPrice: ${article.currency} ${article.price}\n\n${article.description}`,
        [{ text: 'Close', style: 'cancel' }]
      );
    }
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <ArticleCard
      article={item}
      onPress={handleArticlePress}
      onLikeChange={handleLikeChange}
      onSaveChange={handleSaveChange}
      // onExternalLink={handleExternalLink}
    />
  );

  return (
    <View style={styles.container}>
      {/* Dynamic background with smooth color transitions */}
      <Animated.View 
        style={[
          styles.beigeBackground, 
          { 
            backgroundColor: backgroundColorAnimValue.interpolate({
              inputRange: [0, 1],
              outputRange: [previousBackgroundColor, currentBackgroundColor],
              extrapolate: 'clamp',
            }),
            opacity: 0.95,
          }
        ]} 
      />
      
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
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          onScroll={handleScroll}
          scrollEventThrottle={16}
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
    height: 661,
    borderBottomLeftRadius: 43,
    borderBottomRightRadius: 43,
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
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: 'transparent',
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
  listContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height,
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
