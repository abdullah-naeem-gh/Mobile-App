import { supabase } from '../lib/supabase';

// Wraps the existing `follows` table (already in use by ProfileScreen for
// follower/following counts: columns `follower_id`, `following_brand_id`,
// `following_user_id`, `created_at`). It's a polymorphic join table — a row
// follows either a brand or a user, never both.

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
