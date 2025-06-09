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
