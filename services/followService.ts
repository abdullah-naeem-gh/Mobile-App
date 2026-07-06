import { supabase } from '../lib/supabase';

// Wraps the existing `follows` table (already in use by ProfileScreen for
// follower/following counts: columns `follower_id`, `following_brand_id`,
// `following_user_id`, `created_at`). It's a polymorphic join table — a row
// follows either a brand or a user, never both.

// A row in a Followers/Following list, normalized across brands and users.
export interface FollowListEntry {
  followId: string;
  id: string;
  kind: 'brand' | 'user';
  name: string;
  subtitle?: string;
  imageUrl?: string;
}

class FollowService {
  /**
   * Whether `followerId` currently follows brand `brandId`.
   */
  async isFollowingBrand(
    followerId: string,
    brandId: string
  ): Promise<{ success: boolean; data?: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_brand_id', brandId)
        .maybeSingle();

      if (error) throw error;

      return { success: true, data: !!data };
    } catch (error) {
      console.error('Error checking follow status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check follow status',
      };
    }
  }

  /**
   * Number of followers a brand has (count of rows in `follows` targeting it).
   */
  async getBrandFollowerCount(brandId: string): Promise<{ success: boolean; data?: number; error?: string }> {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_brand_id', brandId);

      if (error) throw error;

      return { success: true, data: count || 0 };
    } catch (error) {
      console.error('Error fetching brand follower count:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch follower count',
      };
    }
  }

  /**
   * People who follow the given profile (brand or consumer), with the
   * follower's public profile joined in for list rendering.
   */
  async getFollowers(
    profileId: string,
    role: 'consumer' | 'brand'
  ): Promise<{ success: boolean; data?: FollowListEntry[]; error?: string }> {
    try {
      const targetColumn = role === 'brand' ? 'following_brand_id' : 'following_user_id';
      const { data, error } = await supabase
        .from('follows')
        .select(
          `id, created_at, users!follows_follower_id_fkey (id, username, full_name, profile_pic_url)`
        )
        .eq(targetColumn, profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const entries: FollowListEntry[] = (data || [])
        .map((row: any) => {
          const u = Array.isArray(row.users) ? row.users[0] : row.users;
          if (!u) return null;
          return {
            followId: row.id,
            id: u.id,
            kind: 'user' as const,
            name: u.username,
            subtitle: u.full_name || undefined,
            imageUrl: u.profile_pic_url || undefined,
          };
        })
        .filter(Boolean) as FollowListEntry[];

      return { success: true, data: entries };
    } catch (error) {
      console.error('Error fetching followers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch followers',
      };
    }
  }

  /**
   * Brands and users the given account follows, joined with their profiles.
   */
  async getFollowing(
    followerId: string
  ): Promise<{ success: boolean; data?: FollowListEntry[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(
          `id, created_at,
           brands!follows_following_brand_id_fkey (id, name, logo_url, is_verified),
           users!follows_following_user_id_fkey (id, username, full_name, profile_pic_url)`
        )
        .eq('follower_id', followerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const entries: FollowListEntry[] = (data || [])
        .map((row: any) => {
          const brand = Array.isArray(row.brands) ? row.brands[0] : row.brands;
          const user = Array.isArray(row.users) ? row.users[0] : row.users;
          if (brand) {
            return {
              followId: row.id,
              id: brand.id,
              kind: 'brand' as const,
              name: brand.name,
              subtitle: brand.is_verified ? 'Verified brand' : 'Brand',
              imageUrl: brand.logo_url || undefined,
            };
          }
          if (user) {
            return {
              followId: row.id,
              id: user.id,
              kind: 'user' as const,
              name: user.username,
              subtitle: user.full_name || undefined,
              imageUrl: user.profile_pic_url || undefined,
            };
          }
          return null;
        })
        .filter(Boolean) as FollowListEntry[];

      return { success: true, data: entries };
    } catch (error) {
      console.error('Error fetching following:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch following',
      };
    }
  }

  async followBrand(followerId: string, brandId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_brand_id: brandId });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error following brand:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to follow brand',
      };
    }
  }

  async unfollowBrand(followerId: string, brandId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_brand_id', brandId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error unfollowing brand:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unfollow brand',
      };
    }
  }

  /**
   * Toggle follow state for a brand and return the resulting `following`
   * boolean, so callers can update local state in one round trip.
   */
  async toggleFollowBrand(
    followerId: string,
    brandId: string
  ): Promise<{ success: boolean; data?: { following: boolean }; error?: string }> {
    const statusResult = await this.isFollowingBrand(followerId, brandId);
    if (!statusResult.success) {
      return { success: false, error: statusResult.error };
    }

    if (statusResult.data) {
      const result = await this.unfollowBrand(followerId, brandId);
      if (!result.success) return { success: false, error: result.error };
      return { success: true, data: { following: false } };
    }

    const result = await this.followBrand(followerId, brandId);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: { following: true } };
  }
}

export const followService = new FollowService();
