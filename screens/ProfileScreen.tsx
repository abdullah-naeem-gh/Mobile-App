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

  useEffect(() => {
    loadProfile();
  }, [user]);

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
      <ScrollView showsVerticalScrollIndicator={false}>
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
              onPress={() => setSelectedContent('articles')}
            >
              <Text style={styles.contentTabIcon}>📰</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.contentTab,
                selectedContent === 'outfits' && styles.activeContentTab,
              ]}
              onPress={() => setSelectedContent('outfits')}
            >
              <Text style={styles.contentTabIcon}>👕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content Grid Placeholder */}
        <View style={styles.contentGrid}>
          <View style={styles.contentPlaceholder}>
            <Text style={styles.placeholderText}>
              {isBrand 
                ? `${selectedContent === 'articles' ? 'Articles' : 'Outfits'} will be displayed here`
                : 'Outfits will be displayed here'
              }
            </Text>
            <Text style={styles.placeholderSubText}>
              Content grid implementation coming soon
            </Text>
          </View>
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
    fontSize: 24,
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
  },
});
