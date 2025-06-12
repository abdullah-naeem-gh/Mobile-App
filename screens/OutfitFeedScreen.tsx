import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { OutfitCard } from '../components/OutfitCard';
import { outfitService } from '../services/outfitService';
import { useAuth } from '../contexts/AuthContext';

export const OutfitFeedScreen: React.FC = () => {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadOutfits = useCallback(async (
    currentPage: number = 0,
    reset: boolean = false
  ) => {
    if (loading && !reset) return;
    
    setLoading(true);
    
    const { data, error } = await outfitService.getOutfits({
      limit: 20,
      offset: currentPage * 20,
      currentUserId: user?.id,
    });
    
    if (error) {
      Alert.alert('Error', error);
    } else {
      const outfits = data || [];
      if (reset || currentPage === 0) {
        setOutfits(outfits);
      } else {
        setOutfits(prev => [...prev, ...outfits]);
      }
      setHasMore(outfits.length === 20);
    }
    
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    loadOutfits(0, true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOutfits(0, true);
    setPage(0);
    setRefreshing(false);
  }, [loadOutfits]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOutfits(nextPage, false);
    }
  }, [hasMore, loading, page, loadOutfits]);

  const handleOutfitPress = (outfit: any) => {
    Alert.alert('Outfit Details', `Viewing outfit by ${outfit.user.username}`);
  };

  const handleLikeChange = async (outfitId: string, isLiked: boolean) => {
    if (!user) return;

    // Optimistically update UI
    setOutfits(prev =>
      prev.map(outfit =>
        outfit.id === outfitId
          ? {
              ...outfit,
              is_liked: isLiked,
              likes_count: outfit.likes_count + (isLiked ? 1 : -1),
            }
          : outfit
      )
    );

    // Make API call
    const result = isLiked 
      ? await outfitService.likeOutfit(outfitId, user.id)
      : await outfitService.unlikeOutfit(outfitId, user.id);

    if (!result.success) {
      // Revert optimistic update on failure
      setOutfits(prev =>
        prev.map(outfit =>
          outfit.id === outfitId
            ? {
                ...outfit,
                is_liked: !isLiked,
                likes_count: outfit.likes_count + (isLiked ? -1 : 1),
              }
            : outfit
        )
      );
      Alert.alert('Error', result.error || 'Failed to update like');
    }
  };

  const handleSaveChange = async (outfitId: string, isSaved: boolean) => {
    if (!user) return;

    // Optimistically update UI
    setOutfits(prev =>
      prev.map(outfit =>
        outfit.id === outfitId
          ? {
              ...outfit,
              is_saved: isSaved,
              saves_count: outfit.saves_count + (isSaved ? 1 : -1),
            }
          : outfit
      )
    );

    // Make API call
    const result = isSaved 
      ? await outfitService.saveOutfit(outfitId, user.id)
      : await outfitService.unsaveOutfit(outfitId, user.id);

    if (!result.success) {
      // Revert optimistic update on failure
      setOutfits(prev =>
        prev.map(outfit =>
          outfit.id === outfitId
            ? {
                ...outfit,
                is_saved: !isSaved,
                saves_count: outfit.saves_count + (isSaved ? -1 : 1),
              }
            : outfit
        )
      );
      Alert.alert('Error', result.error || 'Failed to update save');
    }
  };

  const handleShowArticles = (outfit: any) => {
    if (outfit.outfit_articles && outfit.outfit_articles.length > 0) {
      Alert.alert(
        'Tagged Articles',
        `This outfit has ${outfit.outfit_articles.length} tagged article(s). Navigation to article details coming soon!`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'No Articles Tagged',
        'This outfit doesn\'t have any tagged articles yet.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const renderOutfit = ({ item }: { item: any }) => (
    <OutfitCard
      outfit={item}
      onPress={handleOutfitPress}
      onLikeChange={handleLikeChange}
      onSaveChange={handleSaveChange}
      onShowArticles={handleShowArticles}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <Text style={styles.title}>Outfits</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.heartIcon}>♡</Text>
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        data={outfits}
        renderItem={renderOutfit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No outfits found</Text>
            <Text style={styles.emptySubText}>Follow users to see their outfit posts</Text>
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  iconButton: {
    padding: 8,
  },
  heartIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  listContainer: {
    paddingBottom: 20,
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
