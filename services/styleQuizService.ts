import { supabase } from '../lib/supabase';

export interface StylePreferences {
  user_id: string;
  style_tags: string[];
  created_at: string;
  updated_at: string;
}

class StyleQuizService {
  /**
   * Upsert the consumer's selected style tags from the Style Quiz.
   * Safe to call repeatedly (e.g. if a user retakes the quiz later) —
   * relies on the unique constraint on user_id in `user_style_preferences`.
   */
  async saveStylePreferences(
    userId: string,
    styleTags: string[]
  ): Promise<{ success: boolean; data?: StylePreferences; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_style_preferences')
        .upsert(
          { user_id: userId, style_tags: styleTags },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as StylePreferences };
    } catch (error) {
      console.error('Error saving style preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save style preferences',
      };
    }
  }

  /**
   * Fetch the consumer's saved style preferences, if any.
   */
  async getStylePreferences(
    userId: string
  ): Promise<{ success: boolean; data?: StylePreferences | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_style_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return { success: true, data: (data as StylePreferences) ?? null };
    } catch (error) {
      console.error('Error fetching style preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch style preferences',
      };
    }
  }
}

export const styleQuizService = new StyleQuizService();
