import { supabase } from '../lib/supabase';
import { Article, CategoryType, GenderType } from '../types';

export interface ArticleFilters {
  gender?: GenderType;
  category?: CategoryType;
  brandId?: string;
  search?: string;
  colors?: string[];
  sizes?: string[];
  limit?: number;
}

export const articleService = {
  /**
   * Fetch articles with filters and pagination
   */
  async getArticles(
    filters: ArticleFilters = {},
    page: number = 0,
    limit?: number
  ): Promise<{ success: boolean; data?: Article[]; error?: string }> {
    try {
      const effectiveLimit = limit || filters.limit || 20;
      
      let query = supabase
        .from('articles')
        .select(`
          *,
          brand:brands(*),
          likes:likes(user_id),
          saves:saves(user_id),
          likes_count:likes!likes_article_id_fkey(count),
          saves_count:saves!saves_article_id_fkey(count)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .range(page * effectiveLimit, (page + 1) * effectiveLimit - 1);

      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.brandId) {
        query = query.eq('brand_id', filters.brandId);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.colors && filters.colors.length > 0) {
        query = query.overlaps('colors', filters.colors);
      }
      if (filters.sizes && filters.sizes.length > 0) {
        query = query.overlaps('sizes', filters.sizes);
      }

      const { data, error } = await query;

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Process articles to include like/save status and actual counts
      const articles: Article[] = (data || []).map(article => {
        // Get actual counts from the aggregated data
        const actualLikesCount = article.likes_count?.[0]?.count || 0;
        const actualSavesCount = article.saves_count?.[0]?.count || 0;
        
        return {
          ...article,
          is_liked: userId ? article.likes.some((like: any) => like.user_id === userId) : false,
          is_saved: userId ? article.saves.some((save: any) => save.user_id === userId) : false,
          likes_count: actualLikesCount,
          saves_count: actualSavesCount,
        };
      });

      return { success: true, data: articles };
    } catch (error) {
      console.error('Error fetching articles:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch articles' 
      };
    }
  },

  /**
   * Like/unlike an article
   */
  async toggleLike(articleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId);
        
        if (error) throw error;

        // Update likes count by decrementing
        const { data: currentArticle } = await supabase
          .from('articles')
          .select('likes_count')
          .eq('id', articleId)
          .single();

        if (currentArticle) {
          await supabase
            .from('articles')
            .update({ likes_count: Math.max(0, (currentArticle.likes_count || 0) - 1) })
            .eq('id', articleId);
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            article_id: articleId
          });
        
        if (error) throw error;

        // Update likes count by incrementing
        const { data: currentArticle } = await supabase
          .from('articles')
          .select('likes_count')
          .eq('id', articleId)
          .single();

        if (currentArticle) {
          await supabase
            .from('articles')
            .update({ likes_count: (currentArticle.likes_count || 0) + 1 })
            .eq('id', articleId);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to toggle like' 
      };
    }
  },

  /**
   * Save/unsave an article
   */
  async toggleSave(articleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already saved
      const { data: existingSave } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .single();

      if (existingSave) {
        // Unsave
        const { error } = await supabase
          .from('saves')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId);
        
        if (error) throw error;

        // Update saves count by decrementing
        const { data: currentArticle } = await supabase
          .from('articles')
          .select('saves_count')
          .eq('id', articleId)
          .single();

        if (currentArticle) {
          await supabase
            .from('articles')
            .update({ saves_count: Math.max(0, (currentArticle.saves_count || 0) - 1) })
            .eq('id', articleId);
        }
      } else {
        // Save
        const { error } = await supabase
          .from('saves')
          .insert({
            user_id: user.id,
            article_id: articleId
          });
        
        if (error) throw error;

        // Update saves count by incrementing
        const { data: currentArticle } = await supabase
          .from('articles')
          .select('saves_count')
          .eq('id', articleId)
          .single();

        if (currentArticle) {
          await supabase
            .from('articles')
            .update({ saves_count: (currentArticle.saves_count || 0) + 1 })
            .eq('id', articleId);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error toggling save:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to toggle save' 
      };
    }
  },

  /**
   * Create a new article
   */
  async createArticle(articleData: Omit<Article, 'id' | 'created_at' | 'likes_count' | 'saves_count'>): Promise<{ success: boolean; data?: Article; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .insert(articleData)
        .select(`
          *,
          brand:brands(*)
        `)
        .single();

      if (error) throw error;

      return { success: true, data: data as Article };
    } catch (error) {
      console.error('Error creating article:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create article' 
      };
    }
  },

  /**
   * Get liked articles for a user
   */
  async getLikedArticles(userId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          articles!likes_article_id_fkey (
            id,
            title,
            image_urls,
            price,
            currency,
            brands!articles_brand_id_fkey (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .not('article_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const likedArticles = (data || []).map((like: any) => ({
        id: like.id,
        created_at: like.created_at,
        articles: like.articles ? {
          id: like.articles.id,
          title: like.articles.title,
          image_urls: like.articles.image_urls,
          price: like.articles.price,
          currency: like.articles.currency,
          brands: Array.isArray(like.articles.brands) ? like.articles.brands[0] : like.articles.brands,
        } : null,
        outfits: null,
      }));

      return { success: true, data: likedArticles };
    } catch (error) {
      console.error('Error fetching liked articles:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch liked articles' 
      };
    }
  },
};
