export type GenderType = 'male' | 'female' | 'unisex';
export type CategoryType = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories' | 'bags';

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  instagram_handle?: string;
  is_verified: boolean;
  followers_count: number;
  articles_count: number;
  created_at: string;
}

export interface Article {
  id: string;
  brand_id: string;
  title: string;
  description?: string;
  price?: number;
  currency: string;
  image_urls: string[];
  category: CategoryType;
  gender: GenderType;
  sizes: string[];
  colors: string[];
  tags: string[];
  purchase_url?: string;
  is_available: boolean;
  likes_count: number;
  saves_count: number;
  created_at: string;
  brand?: Brand;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface User {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  profile_pic_url?: string;
  gender?: GenderType;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
}

/**
 * The shape `outfitService.getOutfits` returns for the feed/cards — distinct
 * from the raw `Outfit` row above. It normalizes the single `image_url` into
 * an `image_urls` array and flattens either the posting user OR brand into a
 * single `user` object. UI cards bind to THIS shape, not the raw `Outfit`.
 */
export interface OutfitCardArticle {
  x_position: number;
  y_position: number;
  articles: {
    id: string;
    title: string;
    price?: number;
    currency?: string;
    image_urls?: string[];
    purchase_url?: string;
  };
}

export interface OutfitCardUser {
  id: string;
  username: string;
  profile_image_url?: string;
}

export interface OutfitCardData {
  id: string;
  image_urls: string[];
  description?: string;
  user: OutfitCardUser;
  likes_count: number;
  saves_count: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  style_tags?: string[];
  outfit_articles?: OutfitCardArticle[];
}

export interface Outfit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url: string;
  occasion?: string;
  style_tags?: string[];
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  outfit_articles?: {
    id: string;
    outfit_id: string;
    article_id: string;
    x_position: number;
    y_position: number;
  }[];
  is_liked?: boolean;
  is_saved?: boolean;
}
