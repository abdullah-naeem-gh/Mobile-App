import { supabase } from '../lib/supabase';
import { Article, CategoryType, GenderType } from '../types';

export interface ArticleFilters {
  gender?: GenderType;
  category?: CategoryType;
  brandId?: string;
  search?: string;
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
          saves:saves(user_id)
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

      const { data, error } = await query;

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Process articles to include like/save status
      const articles: Article[] = (data || []).map(article => ({
        ...article,
        is_liked: userId ? article.likes.some((like: any) => like.user_id === userId) : false,
        is_saved: userId ? article.saves.some((save: any) => save.user_id === userId) : false,
      }));

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
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            article_id: articleId
          });
        
        if (error) throw error;
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
      } else {
        // Save
        const { error } = await supabase
          .from('saves')
          .insert({
            user_id: user.id,
            article_id: articleId
          });
        
        if (error) throw error;
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
  }
};
