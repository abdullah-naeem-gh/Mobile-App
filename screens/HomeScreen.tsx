import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ArticleCard } from '../components/ArticleCard';
import { Article, CategoryType, GenderType } from '../types';
import { articleService, ArticleFilters } from '../services/articleService';

const categories: CategoryType[] = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags'];
const genders: (GenderType | 'all')[] = ['all', 'male', 'female', 'unisex'];

export const HomeScreen: React.FC = () => {
  const { signOut } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ArticleFilters>({});
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedGender, setSelectedGender] = useState<GenderType | 'all'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadArticles = useCallback(async (
    currentPage: number = 0, 
    currentFilters: ArticleFilters = filters,
    reset: boolean = false
  ) => {
    if (loading && !reset) return;
    
    setLoading(true);
    
    const activeFilters = {
      ...currentFilters,
      gender: selectedGender !== 'all' ? selectedGender : undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    };

    const { data, error } = await articleService.getArticles(activeFilters, currentPage);
    
    if (error) {
      Alert.alert('Error', error);
    } else {
      if (reset || currentPage === 0) {
        setArticles(data);
      } else {
        setArticles(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 20); // Assuming limit is 20
    }
    
    setLoading(false);
  }, [filters, selectedCategory, selectedGender, loading]);

  useEffect(() => {
    loadArticles(0, filters, true);
    setPage(0);
  }, [selectedCategory, selectedGender]);

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
    // Navigate to article details (to be implemented)
    // Define proper button type from React Native's Alert API
    type AlertButton = {
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    };
    
    const buttons: AlertButton[] = [
      { text: 'Close', style: 'cancel' },
    ];
    
    if (article.purchase_url) {
      buttons.push({ 
        text: 'Buy Now', 
        onPress: () => {
          // Handle purchase action here
          console.log('Buy now pressed for:', article.title);
        }
      });
    }
    
    Alert.alert(
      article.title,
      `Brand: ${article.brand?.name}\nPrice: ${article.currency} ${article.price}\n\n${article.description}`,
      buttons
    );
  };

  const renderArticle = ({ item, index }: { item: Article; index: number }) => (
    <View style={[styles.articleContainer, { marginLeft: index % 2 === 0 ? 0 : 10 }]}>
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
      <View style={styles.header}>
        <Text style={styles.title}>Articles</Text>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Gender Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {genders.map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.filterButton,
              selectedGender === gender && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedGender(gender as any)}
          >
            <Text
              style={[
                styles.filterText,
                selectedGender === gender && styles.activeFilterText,
              ]}
            >
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedCategory === 'all' && styles.activeFilterButton,
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text
            style={[
              styles.filterText,
              selectedCategory === 'all' && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === category && styles.activeFilterText,
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No articles found</Text>
            <Text style={styles.emptySubText}>Try adjusting your filters</Text>
          </View>
        }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    color: '#666666',
    fontSize: 14,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
  },
  activeFilterButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  filterText: {
    fontSize: 14,
    color: '#ffffff',
  },
  activeFilterText: {
    color: '#000000',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  articleContainer: {
    flex: 1,
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
