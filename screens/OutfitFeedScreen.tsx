import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { OutfitCard } from '../components/OutfitCard';
import { outfitService } from '../services/outfitService';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export const OutfitFeedScreen: React.FC = () => {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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

    // Make API call using toggle method
    const result = await outfitService.toggleLike(outfitId);

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

    // Make API call using toggle method
    const result = await outfitService.toggleSave(outfitId);

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

  const renderOutfit = ({ item }: { item: any }) => (
    <OutfitCard
      outfit={item}
      onPress={handleOutfitPress}
      onLikeChange={handleLikeChange}
      onSaveChange={handleSaveChange}
    />
  );

  return (
    <View style={styles.container}>
      {/* Platform-specific status bar */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#E8D5C4" 
        translucent={Platform.OS === 'android'}
      />
      
      {/* Static beige background */}
      <View style={styles.beigeBackground} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="search-outline" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={outfits}
          renderItem={renderOutfit}
          keyExtractor={(item) => item.id}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={height * 0.9}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
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
    backgroundColor: '#E8D5C4',
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
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    // Safe area inset is handled by SafeAreaView; this is just visual breathing room
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  logo: {
    width: width * 0.55,
    height: width * 0.18,
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
  listContainer: {
    flexGrow: 1,
    // Only add padding for Android, keep iOS as is
    ...(Platform.OS === 'android' && {
      paddingTop: 90,
    }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height - 200, // Adjust for header
    // Only add padding for Android, keep iOS as is
    ...(Platform.OS === 'android' && {
      paddingTop: 90,
    }),
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
