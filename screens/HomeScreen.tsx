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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ArticleCard } from '../components/ArticleCard';
import { FiltersModal } from '../components/FiltersModal';
import { Article, CategoryType, GenderType } from '../types';
import { articleService, ArticleFilters } from '../services/articleService';

export const HomeScreen: React.FC = () => {
  const { signOut } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ArticleFilters>({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isScrollingDown = useRef(false);

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
                          (filters.sizes && filters.sizes.length > 0);

  const handleLikeChange = (articleId: string, isLiked: boolean) => {
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
  };

  const handleSaveChange = (articleId: string, isSaved: boolean) => {
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
  };

  const handleArticlePress = (article: Article) => {
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

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        const diff = currentOffset - lastScrollY.current;
        
        if (Math.abs(diff) > 5) { // Only animate if scroll difference is significant
          if (currentOffset <= 0) {
            // At the top, always show header
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start();
          } else if (diff > 0 && !isScrollingDown.current) {
            // Scrolling down, hide header
            isScrollingDown.current = true;
            Animated.timing(headerTranslateY, {
              toValue: -100,
              duration: 200,
              useNativeDriver: false,
            }).start();
          } else if (diff < 0 && isScrollingDown.current) {
            // Scrolling up, show header
            isScrollingDown.current = false;
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start();
          }
          
          lastScrollY.current = currentOffset;
        }
      }
    }
  );

  const headerOpacity = headerTranslateY.interpolate({
    inputRange: [-100, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderArticle = ({ item }: { item: Article }) => (
    <View style={styles.articleContainer}>
      <ArticleCard
        article={item}
        onPress={handleArticlePress}
        onLikeChange={handleLikeChange}
        onSaveChange={handleSaveChange}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[
        styles.header, 
        { 
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }]
        }
      ]}>
        <Text style={styles.title}>Kaprayy</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={[styles.iconButton, hasActiveFilters && styles.activeFilterIcon]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Text style={[styles.filterIcon, hasActiveFilters && styles.activeFilterIconText]}>⚙</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>



      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    paddingTop: 60, // Account for SafeAreaView
    paddingBottom: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginRight: 10,
  },
  filterIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  activeFilterIcon: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  activeFilterIconText: {
    color: '#000000',
  },
  listContainer: {
    paddingTop: 75, // Just enough space for the header (60 + 12 + some text space)
    paddingBottom: 20,
  },
  articleContainer: {
    marginBottom: 20,
    backgroundColor: '#000000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666666',
  },
});
