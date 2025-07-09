import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Article } from '../types';
import { articleService } from '../services/articleService';

const { width, height } = Dimensions.get('window');

export const FullScreenArticleScreen: React.FC<any> = ({
  route,
  navigation,
}) => {
  const { articles: initialArticles, initialIndex } = route.params;
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

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
        'No Purchase Link',
        'This article doesn\'t have a purchase link available.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderArticle = ({ item, index }: { item: Article; index: number }) => {
    const imageUrl = item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null;
    const isLoading = imageLoadingStates[item.id] !== false;

    return (
      <View style={styles.articleContainer}>
        {/* Black Background */}
        <View style={styles.blackBackground} />
        
        {/* Centered Image */}
        <View style={styles.imageContainer}>
          {!imageUrl ? (
            <View style={styles.noImageContainer}>
              <Icon name="image-outline" size={60} color="#666666" />
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          ) : (
            <>
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#ffffff" />
                </View>
              )}
              <Image
                source={{ uri: imageUrl }}
                style={styles.centeredImage}
                resizeMode="contain"
                onLoad={() => {
                  setImageLoadingStates(prev => ({ ...prev, [item.id]: false }));
                }}
                onError={() => {
                  setImageLoadingStates(prev => ({ ...prev, [item.id]: false }));
                }}
              />
              {/* Subtle overlay for better text readability on light images */}
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
                style={styles.subtleGradient}
                pointerEvents="none"
              />
            </>
          )}
        </View>

        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.brandInfo}>
            <View style={styles.brandImageContainer}>
              {item.brand?.logo_url ? (
                <Image
                  source={{ uri: item.brand.logo_url }}
                  style={styles.brandImage}
                />
              ) : (
                <View style={styles.brandImagePlaceholder}>
                  <Text style={styles.brandInitial}>
                    {item.brand?.name?.charAt(0)?.toUpperCase() || 'B'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.brandDetails}>
              <Text style={styles.brandName}>{item.brand?.name || 'Unknown Brand'}</Text>
              <Text style={styles.articleCategory}>{item.category}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Icon name="ellipsis-vertical" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLikeChange(item.id, !item.is_liked)}
          >
            <Icon 
              name={item.is_liked ? "heart" : "heart-outline"} 
              size={32} 
              color={item.is_liked ? "#ff3040" : "#ffffff"} 
            />
            <Text style={styles.actionCount}>
              {item.likes_count > 0 ? item.likes_count.toLocaleString() : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleSaveChange(item.id, !item.is_saved)}
          >
            <Icon 
              name={item.is_saved ? "bookmark" : "bookmark-outline"} 
              size={28} 
              color={item.is_saved ? "#4CAF50" : "#ffffff"} 
            />
            <Text style={styles.actionCount}>
              {item.saves_count > 0 ? item.saves_count.toLocaleString() : ''}
            </Text>
          </TouchableOpacity>

          {item.purchase_url && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleExternalLink(item)}
            >
              <Icon name="bag-outline" size={28} color="#ffffff" />
              <Text style={styles.actionLabel}>Shop</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.articleTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {item.currency} {item.price?.toLocaleString() || '0'}
            </Text>
            {item.sizes.length > 0 && (
              <Text style={styles.sizes}>
                Sizes: {item.sizes.slice(0, 3).join(', ')}
                {item.sizes.length > 3 ? '...' : ''}
              </Text>
            )}
          </View>
          {item.colors.length > 0 && (
            <View style={styles.colorsContainer}>
              <Text style={styles.colorsLabel}>Colors: </Text>
              <View style={styles.colorsList}>
                {item.colors.slice(0, 4).map((color, idx) => (
                  <View 
                    key={idx} 
                    style={[styles.colorDot, { backgroundColor: color.toLowerCase() }]} 
                  />
                ))}
                {item.colors.length > 4 && (
                  <Text style={styles.moreColors}>+{item.colors.length - 4}</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Page Indicator */}
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            {index + 1} / {articles.length}
          </Text>
        </View>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <>
      <SafeAreaView style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={false}
          contentInsetAdjustmentBehavior="never" // Prevents safe area from affecting content
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  articleContainer: {
    width,
    height,
    position: 'relative',
    backgroundColor: '#000000', // Black background
  },
  blackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  imageContainer: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    bottom: 320, // Increased from 260 to make more room for bottom content
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  centeredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  subtleGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  imageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  noImageText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 12,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  topHeader: {
    position: 'absolute',
    top: 20, // Reduced back to minimal top spacing
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  brandInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandImageContainer: {
    marginRight: 12,
  },
  brandImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333333',
  },
  brandImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  brandDetails: {
    flex: 1,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  articleCategory: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moreButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 300, // Adjusted from 240 to align with new bottom content position
    alignItems: 'center',
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 8,
  },
  actionCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 100, // Changed from 0 to move content up above the tab bar
    left: 0,
    right: 80,
    padding: 16,
    paddingBottom: 80, // Reduced from 120 as we've already moved the entire container up
    zIndex: 10,
  },
  articleTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13, // Reverted back to original
    lineHeight: 18, // Reverted back to original
    marginBottom: 8, // Reverted back to original
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6, // Reverted back to original
  },
  price: {
    color: '#ffffff',
    fontSize: 20, // Reverted back to original
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sizes: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12, // Reverted back to original
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  colorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginRight: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  colorsList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  moreColors: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pageIndicator: {
    position: 'absolute',
    top: 80, // Adjusted to align with new header position
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  pageText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
});
