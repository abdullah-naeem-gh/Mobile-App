import { supabase } from '../lib/supabase';

export interface SavedItem {
  id: string;
  created_at: string;
  articles?: {
    id: string;
    title: string;
    image_urls: string[];
    price: number;
    currency: string;
    brand_id: string;
    brands: { name: string };
  } | null;
  outfits?: {
    id: string;
    title: string;
    image_url: string;
    user_id: string | null;
    brand_id: string | null;
    users: { username: string } | null;
  } | null;
  /** True when the underlying article/outfit was posted by a brand the user follows. */
  from_followed_brand: boolean;
}

export type SmartCollectionId = 'all' | 'articles' | 'outfits' | 'followed_brands';

export interface SmartCollection {
  id: SmartCollectionId;
  label: string;
  count: number;
}

class SavesService {
  /**
   * Get all saved items (articles and outfits) for a user, hydrated with
   * enough brand/user detail to render the Saved grid and to compute
   * "smart collections" (e.g. saves from brands the user follows).
   * Mirrors the aggregation pattern in likesService.getLikedItems.
   */
  async getSavedItems(userId: string): Promise<{ success: boolean; data?: SavedItem[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('id, created_at, article_id, outfit_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Brands the user follows — used to flag "from a brand you follow"
      // server-side rather than the client guessing at it.
      const { data: followedBrandRows } = await supabase
        .from('follows')
        .select('following_brand_id')
        .eq('follower_id', userId)
        .not('following_brand_id', 'is', null);
      const followedBrandIds = new Set((followedBrandRows || []).map((r: any) => r.following_brand_id));

      const hydrated = await Promise.all(
        (data || []).map(async (save): Promise<SavedItem> => {
          const item: SavedItem = {
            id: save.id,
            created_at: save.created_at,
            articles: null,
            outfits: null,
            from_followed_brand: false,
          };

          if (save.article_id) {
            const { data: a } = await supabase
              .from('articles')
              .select('id, title, image_urls, price, currency, brand_id, brands!articles_brand_id_fkey ( name )')
              .eq('id', save.article_id)
              .single();
            if (a) {
              item.articles = {
                id: a.id,
                title: a.title,
                image_urls: a.image_urls,
                price: a.price,
                currency: a.currency,
                brand_id: a.brand_id,
                brands: Array.isArray(a.brands) ? a.brands[0] : a.brands,
              };
              item.from_followed_brand = followedBrandIds.has(a.brand_id);
            }
          }

          if (save.outfit_id) {
            const { data: o } = await supabase
              .from('outfits')
              .select('id, title, image_url, user_id, brand_id, users!outfits_user_id_fkey ( username )')
              .eq('id', save.outfit_id)
              .single();
            if (o) {
              item.outfits = {
                id: o.id,
                title: o.title,
                image_url: o.image_url,
                user_id: o.user_id,
                brand_id: o.brand_id,
                users: Array.isArray(o.users) ? o.users[0] : o.users,
              };
              item.from_followed_brand = !!o.brand_id && followedBrandIds.has(o.brand_id);
            }
          }

          return item;
        }),
      );

      return { success: true, data: hydrated };
    } catch (error) {
      console.error('Error fetching saved items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch saved items',
      };
    }
  }

  /**
   * Remove a save by save ID.
   */
  async removeSave(saveId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('saves').delete().eq('id', saveId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing save:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove save',
      };
    }
  }

  /**
   * Compute the smart collections (and their counts) for a set of already
   * hydrated saved items. Kept as a pure grouping step, separate from the
   * fetch, so screens can recompute cheaply after e.g. an unsave.
   */
  computeCollections(items: SavedItem[]): SmartCollection[] {
    const articleCount = items.filter((i) => i.articles).length;
    const outfitCount = items.length - articleCount;
    const followedBrandCount = items.filter((i) => i.from_followed_brand).length;

    return [
      { id: 'all', label: 'All saves', count: items.length },
      { id: 'articles', label: 'Articles', count: articleCount },
      { id: 'outfits', label: 'Outfits', count: outfitCount },
      { id: 'followed_brands', label: 'From brands you follow', count: followedBrandCount },
    ];
  }
}

export const savesService = new SavesService();
