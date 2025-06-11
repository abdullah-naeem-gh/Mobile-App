import { supabase } from '../lib/supabase';
import { Outfit } from '../types';

export interface CreateOutfitData {
  user_id: string;
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
  async createOutfit(
    outfitData: CreateOutfitData,
    tags: OutfitTag[] = []
  ): Promise<{ success: boolean; data?: Outfit; error?: string; outfitId?: string }> {
    try {
      console.log(`Creating outfit with ${tags.length} tags`);
      
      // Create the outfit first
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
    limit?: number;
    offset?: number;
  } = {}): Promise<{ success: boolean; data?: Outfit[]; error?: string }> {
    try {
      let query = supabase
        .from('outfits')
        .select(`
          *,
          users:user_id(username, profile_pic_url),
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

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get outfits error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const outfitService = new OutfitService();
