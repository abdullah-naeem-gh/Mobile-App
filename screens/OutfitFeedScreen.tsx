import React, { useState, useRef } from 'react';
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

// Mock data for now - replace with actual data later
const mockOutfits = [
  {
    id: '1',
    image_urls: ['https://example.com/outfit1.jpg'],
    description: 'Perfect outfit for a casual day out! Love this combination 💕',
    user: {
      id: 'user1',
      username: 'fashionista_sarah',
      profile_image_url: 'https://example.com/user1.jpg',
    },
    likes_count: 124,
    saves_count: 32,
    is_liked: false,
    is_saved: false,
    created_at: '2023-12-01T10:00:00Z',
  },
  {
    id: '2',
    image_urls: ['https://example.com/outfit2.jpg'],
    description: 'Street style vibes ✨',
    user: {
      id: 'user2',
      username: 'style_maven',
    },
    likes_count: 89,
    saves_count: 21,
    is_liked: true,
    is_saved: false,
    created_at: '2023-12-01T08:30:00Z',
  },
];

export const OutfitFeedScreen: React.FC = () => {
  const [outfits, setOutfits] = useState(mockOutfits);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleRefresh = () => {
    setRefreshing(true);
    // TODO: Implement actual refresh logic
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleOutfitPress = (outfit: any) => {
    Alert.alert('Outfit Details', `Viewing outfit by ${outfit.user.username}`);
  };

  const handleLikeChange = (outfitId: string, isLiked: boolean) => {
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
  };

  const handleSaveChange = (outfitId: string, isSaved: boolean) => {
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
  };

  const handleShowArticles = (outfit: any) => {
    Alert.alert(
      'Show Articles',
      `This will show tagged articles for ${outfit.user.username}'s outfit`,
      [{ text: 'OK' }]
    );
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
