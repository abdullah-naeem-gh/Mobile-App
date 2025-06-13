import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface BrandProfile {
  id: string;
  name: string;
  email: string;
  logo_url?: string;
  description?: string;
  website_url?: string;
  followers_count: number;
  following_count: number;
  articles_count: number;
  outfits_count: number;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profile_image_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  outfits_count: number;
}

type ContentType = 'articles' | 'outfits';

export const ProfileScreen: React.FC = () => {
  const { user, userRole, signOut } = useAuth();
  const [profile, setProfile] = useState<BrandProfile | UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentType>('articles');
  const [isFollowing, setIsFollowing] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (profile && userRole) {
      loadContent();
    }
  }, [profile, userRole, selectedContent]);

  const loadProfile = async () => {
    if (!user || !userRole) return;
    
    setLoading(true);
    try {
      if (userRole === 'brand') {
        // Fetch brand profile with counts
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select(`
            id,
            name,
            description,
            logo_url,
            website_url,
            followers_count,
            articles_count
          `)
          .eq('id', user.id)
          .single();

        if (brandError) {
          throw new Error('Failed to fetch brand profile');
        }

        // Get actual counts from related tables
        const [articlesCount, outfitsCount, followersCount] = await Promise.all([
          supabase
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .eq('brand_id', user.id),
          supabase
            .from('outfits')
            .select('id', { count: 'exact', head: true })
            .eq('brand_id', user.id),
          supabase
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_brand_id', user.id)
        ]);

        // Get following count (brands/users this brand follows)
        const { count: followingCount } = await supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        const brandProfile: BrandProfile = {
          id: brandData.id,
          name: brandData.name,
          email: user.email || '',
          logo_url: brandData.logo_url,
          description: brandData.description,
          website_url: brandData.website_url,
          followers_count: followersCount.count || 0,
          following_count: followingCount || 0,
          articles_count: articlesCount.count || 0,
          outfits_count: outfitsCount.count || 0,
        };

        setProfile(brandProfile);
        setSelectedContent('articles');
      } else {
        // Fetch user profile with counts
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            username,
            full_name,
            bio,
            profile_pic_url,
            followers_count,
            following_count,
            posts_count
          `)
          .eq('id', user.id)
          .single();

        if (userError) {
          throw new Error('Failed to fetch user profile');
        }

        // Get actual counts from related tables
        const [outfitsCount, followersCount] = await Promise.all([
          supabase
            .from('outfits')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_user_id', user.id)
        ]);

        // Get following count (users/brands this user follows)
        const { count: followingCount } = await supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        const userProfile: UserProfile = {
          id: userData.id,
          username: userData.username,
          email: user.email || '',
          profile_image_url: userData.profile_pic_url,
          bio: userData.bio,
          followers_count: followersCount.count || 0,
          following_count: followingCount || 0,
          outfits_count: outfitsCount.count || 0,
        };

        setProfile(userProfile);
        setSelectedContent('outfits');
      }
    } catch (error) {
      console.error('Profile loading error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    if (!user || !userRole) return;
    
    setContentLoading(true);
    setContentError(null);
    try {
      if (userRole === 'brand') {
        if (selectedContent === 'articles') {
          // Load articles for brand
          const { data, error } = await supabase
            .from('articles')
            .select(`
              id,
              title,
              image_urls,
              price,
              currency,
              created_at
            `)
            .eq('brand_id', user.id)
            .eq('is_available', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading articles:', error);
          } else {
            setArticles(data || []);
          }
        } else {
          // Load outfits for brand
          const { data, error } = await supabase
            .from('outfits')
            .select(`
              id,
              title,
              image_url,
              created_at
            `)
            .eq('brand_id', user.id)
            .eq('is_public', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading outfits:', error);
          } else {
            setOutfits(data || []);
          }
        }
      } else {
        // Load outfits for user (consumers don't have articles)
        const { data, error } = await supabase
          .from('outfits')
          .select(`
            id,
            title,
            image_url,
            created_at
          `)
          .eq('user_id', user.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading outfits:', error);
        } else {
          setOutfits(data || []);
        }
      }
    } catch (error) {
      console.error('Content loading error:', error);
      setContentError('Failed to load content. Please try again.');
    } finally {
      setContentLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadContent()]);
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile functionality will be implemented');
  };

  const handleShare = () => {
    Alert.alert('Share Profile', 'Share profile functionality will be implemented');
  };

  const handleMessage = () => {
    Alert.alert('Message', 'Messaging functionality will be implemented');
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Implement actual follow/unfollow logic
  };

  const isBrand = userRole === 'brand';
  const isOwnProfile = true; // Since this is the logged-in user's profile

  const handleContentTypeChange = (contentType: ContentType) => {
    if (contentType === selectedContent) return; // Don't reload if same type
    
    setSelectedContent(contentType);
    setContentError(null);
    
    // Clear previous content when switching to show immediate feedback
    if (contentType === 'articles') {
      setOutfits([]);
    } else {
      setArticles([]);
    }
  };

  const renderGridItem = ({ item, index }: { item: any; index: number }) => {
    const isArticle = selectedContent === 'articles';
    const imageUrl = isArticle 
      ? (item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null)
      : item.image_url;

    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => handleContentPress(item, isArticle)}
        activeOpacity={0.8}
      >
        {imageUrl ? (
          <>
            {imageLoading && (
              <View style={styles.gridImageLoading}>
                <ActivityIndicator size="small" color="#666666" />
              </View>
            )}
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.gridImage}
              resizeMode="cover"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          </>
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Text style={styles.gridImagePlaceholderText}>No Image</Text>
          </View>
        )}
        {isArticle && item.price && !imageLoading && (
          <View style={styles.priceOverlay}>
            <Text style={styles.priceText}>
              {item.currency || 'PKR'} {item.price}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleContentPress = (item: any, isArticle: boolean) => {
    Alert.alert(
      isArticle ? 'Article Details' : 'Outfit Details',
      `${isArticle ? 'Article' : 'Outfit'}: ${item.title || 'Untitled'}\n\nCreated: ${new Date(item.created_at).toLocaleDateString()}`,
      [
        { text: 'View Details', onPress: () => {
          // TODO: Navigate to detailed view
          console.log(`Navigate to ${isArticle ? 'article' : 'outfit'} details:`, item.id);
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getContentData = () => {
    if (isBrand) {
      return selectedContent === 'articles' ? articles : outfits;
    } else {
      return outfits;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ffffff"
            colors={["#ffffff"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.username}>
            {isBrand ? (profile as BrandProfile).name : (profile as UserProfile).username}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {(isBrand ? (profile as BrandProfile).logo_url : (profile as UserProfile).profile_image_url) ? (
                <Image
                  source={{ 
                    uri: isBrand 
                      ? (profile as BrandProfile).logo_url 
                      : (profile as UserProfile).profile_image_url 
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {isBrand 
                      ? (profile as BrandProfile).name.charAt(0).toUpperCase()
                      : (profile as UserProfile).username.charAt(0).toUpperCase()
                    }
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {isBrand ? (profile as BrandProfile).articles_count + (profile as BrandProfile).outfits_count : (profile as UserProfile).outfits_count}
                </Text>
                <Text style={styles.statLabel}>posts</Text>
              </View>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.followers_count}</Text>
                <Text style={styles.statLabel}>followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.following_count}</Text>
                <Text style={styles.statLabel}>following</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bio/Description */}
          <View style={styles.bioSection}>
            <Text style={styles.displayName}>
              {isBrand ? (profile as BrandProfile).name : (profile as UserProfile).username}
            </Text>
            {(isBrand ? (profile as BrandProfile).description : (profile as UserProfile).bio) && (
              <Text style={styles.bio}>
                {isBrand ? (profile as BrandProfile).description : (profile as UserProfile).bio}
              </Text>
            )}
            {isBrand && (profile as BrandProfile).website_url && (
              <TouchableOpacity>
                <Text style={styles.website}>{(profile as BrandProfile).website_url}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Text style={styles.shareButtonText}>Share Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.followButton, isFollowing && styles.followingButton]} 
                  onPress={handleFollow}
                >
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Content Type Selector (for brands) */}
        {isBrand && (
          <View style={styles.contentSelector}>
            <TouchableOpacity
              style={[
                styles.contentTab,
                selectedContent === 'articles' && styles.activeContentTab,
              ]}
              onPress={() => handleContentTypeChange('articles')}
            >
              <Text style={styles.contentTabIcon}>📰</Text>
              <Text style={styles.contentTabCount}>{articles.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.contentTab,
                selectedContent === 'outfits' && styles.activeContentTab,
              ]}
              onPress={() => handleContentTypeChange('outfits')}
            >
              <Text style={styles.contentTabIcon}>👕</Text>
              <Text style={styles.contentTabCount}>{outfits.length}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content Grid */}
        <View style={styles.contentGrid}>
          {contentLoading ? (
            <View style={styles.contentLoadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Loading {isBrand ? selectedContent : 'outfits'}...</Text>
            </View>
          ) : contentError ? (
            <View style={styles.contentErrorContainer}>
              <Text style={styles.errorText}>{contentError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadContent}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {getContentData().length > 0 ? (
                <FlatList
                  data={getContentData()}
                  renderItem={renderGridItem}
                  numColumns={3}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={styles.gridContainer}
                  columnWrapperStyle={getContentData().length > 0 ? styles.gridRow : undefined}
                />
              ) : (
                <View style={styles.contentPlaceholder}>
                  <Text style={styles.placeholderIcon}>
                    {isBrand ? (selectedContent === 'articles' ? '📰' : '👕') : '👕'}
                  </Text>
                  <Text style={styles.placeholderText}>
                    No {isBrand ? selectedContent : 'outfits'} uploaded yet
                  </Text>
                  <Text style={styles.placeholderSubText}>
                    Start creating {isBrand ? selectedContent : 'outfits'} to see them here
                  </Text>
                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => Alert.alert(
                      'Create Content', 
                      `Navigate to create ${isBrand ? selectedContent : 'outfit'} screen`
                    )}
                  >
                    <Text style={styles.createButtonText}>
                      Create {isBrand ? (selectedContent === 'articles' ? 'Article' : 'Outfit') : 'Outfit'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  username: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 20,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  profileSection: {
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 2,
  },
  bioSection: {
    marginBottom: 20,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 18,
    marginBottom: 4,
  },
  website: {
    fontSize: 14,
    color: '#0095f6',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#222222',
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: '#222222',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    flex: 1,
    backgroundColor: '#0095f6',
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  followingButton: {
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  followingButtonText: {
    color: '#ffffff',
  },
  messageButton: {
    backgroundColor: '#222222',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  contentSelector: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#333333',
  },
  contentTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeContentTab: {
    borderBottomColor: '#ffffff',
  },
  contentTabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  contentTabCount: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  contentGrid: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentPlaceholder: {
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  placeholderText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Grid styles
  contentLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 10,
  },
  contentErrorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 50) / 3, // Account for padding and gaps between items
    aspectRatio: 1,
    marginBottom: 2,
    marginHorizontal: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#111111',
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
    backgroundColor: '#111111',
    zIndex: 1,
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222222',
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
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});
