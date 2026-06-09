import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MenuScreen } from './MenuScreen';
import { SavedScreen } from './SavedScreen';
import { LikesScreen } from './LikesScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

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
  const [showMenu, setShowMenu] = useState(false);
  const [showSavedScreen, setShowSavedScreen] = useState(false);
  const [showLikesScreen, setShowLikesScreen] = useState(false);
  // Add state for image loading/errors that will be used by all grid items
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const [imageErrorStates, setImageErrorStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (profile && userRole) {
      loadContent();
    }
  }, [profile, userRole, selectedContent]);

  // Initialize loading states whenever content data changes
  useEffect(() => {
    const contentData = getContentData();
    if (contentData && contentData.length > 0) {
      const newLoadingStates: {[key: string]: boolean} = {};
      contentData.forEach(item => {
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
  }, [articles, outfits]);

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

  const handleMenuOpen = () => {
    setShowMenu(true);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const handleMenuNavigate = (screen: string) => {
    switch (screen) {
      case 'Saved':
        setShowSavedScreen(true);
        break;
      case 'Likes':
        setShowLikesScreen(true);
        break;
      case 'AccountSettings':
        Alert.alert('Account Settings', 'Account settings functionality will be implemented');
        break;
      case 'Followers':
        Alert.alert('Followers', 'Followers functionality will be implemented');
        break;
      case 'Following':
        Alert.alert('Following', 'Following functionality will be implemented');
        break;
      default:
        console.log('Unknown menu item:', screen);
    }
  };

  const handleSavedScreenBack = () => {
    setShowSavedScreen(false);
  };

  const handleLikesScreenBack = () => {
    setShowLikesScreen(false);
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

  const handleImageLoaded = (itemId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [itemId]: false
    }));
  };

  const handleImageError = (itemId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [itemId]: false
    }));
    setImageErrorStates(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  const renderGridItem = ({ item, index }: { item: any; index: number }) => {
    const isArticle = selectedContent === 'articles';
    const imageUrl = isArticle 
      ? (item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null)
      : item.image_url;
    
    const imageId = item.id;
    const isImageLoading = imageLoadingStates[imageId] !== false;
    const hasImageError = imageErrorStates[imageId] === true;

    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => handleContentPress(item, isArticle)}
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
              onError={() => handleImageError(imageId)}
            />
          </>
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Icon name="image-outline" size={24} color="#666666" />
          </View>
        )}
        {isArticle && item.price && !isImageLoading && (
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

  if (showSavedScreen) {
    return <SavedScreen onBack={handleSavedScreenBack} />;
  }

  if (showLikesScreen) {
    return <LikesScreen onBack={handleLikesScreenBack} />;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.beigeBackground} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.beigeBackground} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Icon name="person-outline" size={48} color="#666666" />
            <Text style={styles.errorText}>Failed to load profile</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
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
      
      {/* Static beige background */}
      <View style={styles.beigeBackground} />
      
      <SafeAreaView style={styles.safeArea}>
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Icon name="settings-outline" size={24} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMenuOpen} style={styles.headerButton}>
                <Icon name="menu-outline" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
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
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {isBrand ? (profile as BrandProfile).name : (profile as UserProfile).username}
                </Text>
                {(isBrand ? (profile as BrandProfile).description : (profile as UserProfile).bio) && (
                  <Text style={styles.profileBio}>
                    {isBrand ? (profile as BrandProfile).description : (profile as UserProfile).bio}
                  </Text>
                )}
                {isBrand && (profile as BrandProfile).website_url && (
                  <TouchableOpacity>
                    <Text style={styles.profileWebsite}>{(profile as BrandProfile).website_url}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsSection}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {isBrand ? (profile as BrandProfile).articles_count + (profile as BrandProfile).outfits_count : (profile as UserProfile).outfits_count}
                </Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity style={styles.statCard}>
                <Text style={styles.statNumber}>{profile.followers_count}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard}>
                <Text style={styles.statNumber}>{profile.following_count}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              {isOwnProfile ? (
                <View style={styles.ownProfileActions}>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleEditProfile}>
                    <Icon name="create-outline" size={18} color="#000000" />
                    <Text style={styles.primaryButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
                    <Icon name="share-outline" size={18} color="#666666" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.otherProfileActions}>
                  <TouchableOpacity 
                    style={[styles.primaryButton, isFollowing && styles.followingButton]} 
                    onPress={handleFollow}
                  >
                    <Icon 
                      name={isFollowing ? "checkmark" : "person-add-outline"} 
                      size={18} 
                      color={isFollowing ? "#666666" : "#000000"} 
                    />
                    <Text style={[styles.primaryButtonText, isFollowing && styles.followingButtonText]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleMessage}>
                    <Icon name="chatbubble-outline" size={18} color="#666666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Content Type Selector (for brands) */}
          {isBrand && (
            <View style={styles.contentSelectorCard}>
              <TouchableOpacity
                style={[
                  styles.contentTab,
                  selectedContent === 'articles' && styles.activeContentTab,
                ]}
                onPress={() => handleContentTypeChange('articles')}
              >
                <Icon 
                  name="pricetag-outline" 
                  size={20} 
                  color={selectedContent === 'articles' ? '#000000' : '#666666'} 
                />
                <Text style={[
                  styles.contentTabText,
                  selectedContent === 'articles' && styles.activeContentTabText
                ]}>
                  Articles ({articles.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.contentTab,
                  selectedContent === 'outfits' && styles.activeContentTab,
                ]}
                onPress={() => handleContentTypeChange('outfits')}
              >
                <Icon 
                  name="shirt-outline" 
                  size={20} 
                  color={selectedContent === 'outfits' ? '#000000' : '#666666'} 
                />
                <Text style={[
                  styles.contentTabText,
                  selectedContent === 'outfits' && styles.activeContentTabText
                ]}>
                  Outfits ({outfits.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content Grid */}
          <View style={styles.contentCard}>
            <Text style={styles.contentCardTitle}>
              {isBrand ? (selectedContent === 'articles' ? 'My Articles' : 'My Outfits') : 'My Outfits'}
            </Text>
            
            {contentLoading ? (
              <View style={styles.contentLoadingContainer}>
                <ActivityIndicator size="large" color="#666666" />
                <Text style={styles.contentLoadingText}>Loading {isBrand ? selectedContent : 'outfits'}...</Text>
              </View>
            ) : contentError ? (
              <View style={styles.contentErrorContainer}>
                <Icon name="alert-circle-outline" size={48} color="#ff4444" />
                <Text style={styles.contentErrorText}>{contentError}</Text>
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
                  <View style={styles.emptyContentContainer}>
                    <View style={styles.emptyIconContainer}>
                      <Icon 
                        name={isBrand ? (selectedContent === 'articles' ? 'pricetag-outline' : 'shirt-outline') : 'shirt-outline'} 
                        size={40} 
                        color="#E8D5C4" 
                      />
                    </View>
                    <Text style={styles.emptyContentTitle}>
                      No {isBrand ? selectedContent : 'outfits'} yet
                    </Text>
                    <Text style={styles.emptyContentSubtitle}>
                      Start creating {isBrand ? selectedContent : 'outfits'} to build your collection
                    </Text>
                    <TouchableOpacity 
                      style={styles.createContentButton}
                      onPress={() => Alert.alert(
                        'Create Content', 
                        `Navigate to create ${isBrand ? selectedContent : 'outfit'} screen`
                      )}
                    >
                      <Icon name="add" size={18} color="#000000" />
                      <Text style={styles.createContentButtonText}>
                        Create {isBrand ? (selectedContent === 'articles' ? 'Article' : 'Outfit') : 'Outfit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </SafeAreaView>
      
      {/* Menu Screen */}
      <MenuScreen
        visible={showMenu}
        onClose={handleMenuClose}
        onNavigate={handleMenuNavigate}
      />
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
    height: 180,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  errorText: {
    color: '#000000',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E8D5C4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    marginTop: Platform.OS === 'ios' ? 0 : 10, // Extra spacing for Android
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    borderWidth: 3,
    borderColor: '#E8D5C4',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    borderWidth: 3,
    borderColor: '#E8D5C4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#666666',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileBio: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  profileWebsite: {
    fontSize: 14,
    color: '#0095f6',
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionSection: {
    alignItems: 'center',
  },
  ownProfileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  otherProfileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#E8D5C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  followingButton: {
    backgroundColor: '#f5f5f5',
  },
  followingButtonText: {
    color: '#666666',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  contentLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  contentLoadingText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 12,
  },
  contentErrorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  contentErrorText: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
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
  createContentButton: {
    backgroundColor: '#E8D5C4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createContentButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomSpace: {
    height: 40,
  },
});
