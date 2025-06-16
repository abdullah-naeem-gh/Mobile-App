import { supabase } from '../lib/supabase';
import { Outfit } from '../types';

export interface CreateOutfitData {
  user_id?: string;
  brand_id?: string;
  title: string;
  description?: string;
  image_url: string;
  occasion?: string;
  style_tags?: string[];
  is_public?: boolean;
}

export interface OutfitTag {
  article_id: string;
  x_position: number;
  y_position: number;
}

class OutfitService {
  /**
   * Get liked outfits for a user
   */
  async getLikedOutfits(userId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          outfits!likes_outfit_id_fkey (
            id,
            title,
            image_url,
            users!outfits_user_id_fkey (
              username
            )
          )
        `)
        .eq('user_id', userId)
        .not('outfit_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const likedOutfits = (data || []).map((like: any) => ({
        id: like.id,
        created_at: like.created_at,
        articles: null,
        outfits: like.outfits ? {
          id: like.outfits.id,
          title: like.outfits.title,
          image_url: like.outfits.image_url,
          users: Array.isArray(like.outfits.users) ? like.outfits.users[0] : like.outfits.users,
        } : null,
      }));

      return { success: true, data: likedOutfits };
    } catch (error) {
      console.error('Error fetching liked outfits:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch liked outfits' 
      };
    }
  }

  // Helper method to determine user type and prepare outfit data
  async prepareOutfitData(
    authUserId: string,
    baseOutfitData: Omit<CreateOutfitData, 'user_id' | 'brand_id'>
  ): Promise<{ success: boolean; data?: CreateOutfitData; error?: string }> {
    try {
      // Check user's profile to determine if they're a consumer or brand
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authUserId)
        .single();

      if (profileError) {
        return { success: false, error: 'User profile not found. Please complete onboarding first.' };
      }

      if (profile.role === 'consumer') {
        // For consumers, check if they exist in public.users table
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUserId)
          .single();

        if (userError) {
          return { success: false, error: 'User profile not found in users table. Please complete onboarding first.' };
        }

        return {
          success: true,
          data: {
            ...baseOutfitData,
            user_id: authUserId,
            // brand_id is undefined for consumers
          }
        };
      } else if (profile.role === 'brand') {
        // For brands, check if they exist in public.brands table
        const { data: brand, error: brandError } = await supabase
          .from('brands')
          .select('id')
          .eq('id', authUserId)
          .single();

        if (brandError) {
          return { success: false, error: 'Brand profile not found in brands table. Please complete onboarding first.' };
        }

        return {
          success: true,
          data: {
            ...baseOutfitData,
            brand_id: authUserId,
            // user_id is undefined for brands
          }
        };
      } else {
        return { success: false, error: 'Invalid user role. Must be either consumer or brand.' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createOutfit(
    authUserId: string,
    baseOutfitData: Omit<CreateOutfitData, 'user_id' | 'brand_id'>,
    tags: OutfitTag[] = []
  ): Promise<{ success: boolean; data?: Outfit; error?: string; outfitId?: string }> {
    try {
      console.log(`Creating outfit with ${tags.length} tags for user ${authUserId}`);
      
      // Prepare outfit data based on user type
      const prepResult = await this.prepareOutfitData(authUserId, baseOutfitData);
      if (!prepResult.success || !prepResult.data) {
        return { success: false, error: prepResult.error };
      }

      const outfitData = prepResult.data;
      
      // Create the outfit
      const { data: outfit, error: outfitError } = await supabase
        .from('outfits')
        .insert([outfitData])
        .select()
        .single();

      if (outfitError) {
        console.error('Outfit creation error:', outfitError);
        return { success: false, error: outfitError.message };
      }

      // If there are tags, create outfit_articles entries
      if (tags.length > 0 && outfit) {
        const outfitArticles = tags.map(tag => ({
          outfit_id: outfit.id,
          article_id: tag.article_id,
          x_position: parseFloat(tag.x_position.toFixed(2)), // Ensure we store clean values
          y_position: parseFloat(tag.y_position.toFixed(2)),
        }));

        console.log('Inserting outfit articles:', outfitArticles);

        const { error: tagsError } = await supabase
          .from('outfit_articles')
          .insert(outfitArticles);

        if (tagsError) {
          console.error('Tags creation error:', tagsError);
          // Note: Outfit was created but tags failed
          return {
            success: false,
            error: 'Outfit created but tags failed to save',
            outfitId: outfit.id
          };
        }
      }

      return { success: true, data: outfit };
    } catch (error) {
      console.error('Create outfit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getOutfits(filters: {
    userId?: string;
    brandId?: string;
    limit?: number;
    offset?: number;
    currentUserId?: string;
  } = {}): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      let query = supabase
        .from('outfits')
        .select(`
          *,
          users:user_id(id, username, profile_pic_url),
          brands:brand_id(id, name, logo_url),
          outfit_articles(
            x_position,
            y_position,
            articles(id, title, price, currency, image_urls)
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.brandId) {
        query = query.eq('brand_id', filters.brandId);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get outfits error:', error);
        return { success: false, error: error.message };
      }

      // Get user's likes and saves if currentUserId is provided
      let userLikes: string[] = [];
      let userSaves: string[] = [];

      if (filters.currentUserId && data && data.length > 0) {
        const outfitIds = data.map(outfit => outfit.id);

        // Get user's likes
        const { data: likesData } = await supabase
          .from('likes')
          .select('outfit_id')
          .eq('user_id', filters.currentUserId)
          .in('outfit_id', outfitIds);

        userLikes = likesData?.map(like => like.outfit_id) || [];

        // Get user's saves
        const { data: savesData } = await supabase
          .from('saves')
          .select('outfit_id')
          .eq('user_id', filters.currentUserId)
          .in('outfit_id', outfitIds);

        userSaves = savesData?.map(save => save.outfit_id) || [];
      }

      // Transform data to match OutfitCard interface
      const transformedData = data?.map(outfit => ({
        id: outfit.id,
        image_urls: [outfit.image_url], // Convert single image_url to array format
        description: outfit.description,
        user: outfit.users ? {
          id: outfit.users.id,
          username: outfit.users.username,
          profile_image_url: outfit.users.profile_pic_url,
        } : outfit.brands ? {
          id: outfit.brands.id,
          username: outfit.brands.name, // Use brand name as username for display
          profile_image_url: outfit.brands.logo_url,
        } : null,
        likes_count: outfit.likes_count || 0,
        saves_count: outfit.saves_count || 0,
        is_liked: userLikes.includes(outfit.id),
        is_saved: userSaves.includes(outfit.id),
        created_at: outfit.created_at,
        outfit_articles: outfit.outfit_articles || [],
      })) || [];

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Get outfits error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async likeOutfit(outfitId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('likes')
        .insert([{ outfit_id: outfitId, user_id: userId }]);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update likes count by incrementing
      const { error: updateError } = await supabase.rpc('increment_outfit_likes', {
        outfit_id: outfitId
      });

      if (updateError) {
        // If RPC doesn't exist, fall back to manual update
        const { data: currentOutfit } = await supabase
          .from('outfits')
          .select('likes_count')
          .eq('id', outfitId)
          .single();

        if (currentOutfit) {
          await supabase
            .from('outfits')
            .update({ likes_count: (currentOutfit.likes_count || 0) + 1 })
            .eq('id', outfitId);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async unlikeOutfit(outfitId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('outfit_id', outfitId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update likes count by decrementing
      const { error: updateError } = await supabase.rpc('decrement_outfit_likes', {
        outfit_id: outfitId
      });

      if (updateError) {
        // If RPC doesn't exist, fall back to manual update
        const { data: currentOutfit } = await supabase
          .from('outfits')
          .select('likes_count')
          .eq('id', outfitId)
          .single();

        if (currentOutfit) {
          await supabase
            .from('outfits')
            .update({ likes_count: Math.max(0, (currentOutfit.likes_count || 0) - 1) })
            .eq('id', outfitId);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async saveOutfit(outfitId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('saves')
        .insert([{ outfit_id: outfitId, user_id: userId }]);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update saves count by incrementing
      const { error: updateError } = await supabase.rpc('increment_outfit_saves', {
        outfit_id: outfitId
      });

      if (updateError) {
        // If RPC doesn't exist, fall back to manual update
        const { data: currentOutfit } = await supabase
          .from('outfits')
          .select('saves_count')
          .eq('id', outfitId)
          .single();

        if (currentOutfit) {
          await supabase
            .from('outfits')
            .update({ saves_count: (currentOutfit.saves_count || 0) + 1 })
            .eq('id', outfitId);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async unsaveOutfit(outfitId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('outfit_id', outfitId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update saves count by decrementing
      const { error: updateError } = await supabase.rpc('decrement_outfit_saves', {
        outfit_id: outfitId
      });

      if (updateError) {
        // If RPC doesn't exist, fall back to manual update
        const { data: currentOutfit } = await supabase
          .from('outfits')
          .select('saves_count')
          .eq('id', outfitId)
          .single();

        if (currentOutfit) {
          await supabase
            .from('outfits')
            .update({ saves_count: Math.max(0, (currentOutfit.saves_count || 0) - 1) })
            .eq('id', outfitId);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const outfitService = new OutfitService();
