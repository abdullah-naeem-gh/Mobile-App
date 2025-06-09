import { supabase } from '../lib/supabase';
import { Outfit } from '../types';

export interface TaggedArticle {
  article_id: string;
  x_position: number;
  y_position: number;
}

export interface OutfitCreateData {
  title: string;
  description: string;
  image_url: string;
  occasion: string;
  style_tags: string[];
  tagged_articles: TaggedArticle[];
}

export const outfitService = {
  /**
   * Create a new outfit post with tagged articles
   */
  async createOutfit(
    data: OutfitCreateData
  ): Promise<{ success: boolean; data?: Outfit; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First insert the outfit
      const { data: outfit, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
          image_url: data.image_url,
          occasion: data.occasion,
          style_tags: data.style_tags,
          is_public: true
        })
        .select('*')
        .single();

      if (outfitError) throw outfitError;

      // Then insert the tagged articles if any
      if (data.tagged_articles && data.tagged_articles.length > 0) {
        const taggedArticles = data.tagged_articles.map(tag => ({
          outfit_id: outfit.id,
          article_id: tag.article_id,
          x_position: tag.x_position,
          y_position: tag.y_position
        }));

        const { error: tagError } = await supabase
          .from('outfit_articles')
          .insert(taggedArticles);

        if (tagError) throw tagError;
      }

      return { success: true, data: outfit as unknown as Outfit };
    } catch (error) {
      console.error('Error creating outfit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create outfit'
      };
    }
  },

  /**
   * Get all outfits with pagination and filters
   */
  async getOutfits(
    page: number = 0,
    limit: number = 10,
    userId?: string
  ): Promise<{ data: Outfit[]; error?: string }> {
    try {
      let query = supabase
        .from('outfits')
        .select(`
          *,
          user:users(*),
          outfit_articles(*)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data: data as unknown as Outfit[] };
    } catch (error) {
      console.error('Error fetching outfits:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch outfits'
      };
    }
  }
};
