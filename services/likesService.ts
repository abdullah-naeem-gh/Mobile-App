import { supabase } from '../lib/supabase';
import { articleService } from './articleService';
import { outfitService } from './outfitService';

export interface LikedItem {
  id: string;
  created_at: string;
  articles?: {
    id: string;
    title: string;
    image_urls: string[];
    price: number;
    currency: string;
    brands: {
      name: string;
    };
  } | null;
  outfits?: {
    id: string;
    title: string;
    image_url: string;
    users: {
      username: string;
    };
  } | null;
}

class LikesService {
  /**
   * Get all liked items (articles and outfits) for a user
   */
  async getLikedItems(userId: string): Promise<{ success: boolean; data?: LikedItem[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          article_id,
          outfit_id
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const likedItemsWithDetails = await Promise.all(
        (data || []).map(async (like: any) => {
          const likedItem: LikedItem = {
            id: like.id,
            created_at: like.created_at,
            articles: null,
            outfits: null,
          };

          if (like.article_id) {
            const { data: articleData } = await supabase
              .from('articles')
              .select(`
                id,
                title,
                image_urls,
                price,
                currency,
                brands!articles_brand_id_fkey (
                  name
                )
              `)
              .eq('id', like.article_id)
              .single();

            if (articleData) {
              likedItem.articles = {
                id: articleData.id,
                title: articleData.title,
                image_urls: articleData.image_urls,
                price: articleData.price,
                currency: articleData.currency,
                brands: Array.isArray(articleData.brands) ? articleData.brands[0] : articleData.brands,
              };
            }
          }

          if (like.outfit_id) {
            const { data: outfitData } = await supabase
              .from('outfits')
              .select(`
                id,
                title,
                image_url,
                users!outfits_user_id_fkey (
                  username
                )
              `)
              .eq('id', like.outfit_id)
              .single();

            if (outfitData) {
              likedItem.outfits = {
                id: outfitData.id,
                title: outfitData.title,
                image_url: outfitData.image_url,
                users: Array.isArray(outfitData.users) ? outfitData.users[0] : outfitData.users,
              };
            }
          }

          return likedItem;
        })
      );

      return { success: true, data: likedItemsWithDetails };
    } catch (error) {
      console.error('Error fetching liked items:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch liked items' 
      };
    }
  }

  /**
   * Remove a like by like ID
   */
  async removeLike(likeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', likeId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing like:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove like' 
      };
    }
  }

  /**
   * Get liked articles only
   */
  async getLikedArticles(userId: string): Promise<{ success: boolean; data?: LikedItem[]; error?: string }> {
    const result = await articleService.getLikedArticles(userId);
    return result;
  }

  /**
   * Get liked outfits only
   */
  async getLikedOutfits(userId: string): Promise<{ success: boolean; data?: LikedItem[]; error?: string }> {
    const result = await outfitService.getLikedOutfits(userId);
    return result;
  }
}

export const likesService = new LikesService();
