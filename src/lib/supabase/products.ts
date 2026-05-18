import type { Product } from '@/types/database';
import { createPublicClient } from '@/utils/supabase/server';

export async function getProducts(category?: string): Promise<Product[]> {
  try {
    const supabase = createPublicClient();

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (category && category !== 'Tất cả') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching products:', error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn('Network error fetching products. Returning empty fallback array.', err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.warn(`Error fetching product by slug ${slug}:`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`Network error fetching product ${slug}. Returning null.`, err);
    return null;
  }
}

export async function getProductCategories(): Promise<string[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true);

    if (error) {
      console.warn('Error fetching categories:', error.message);
      return ['Tất cả'];
    }
    const unique = [...new Set((data ?? []).map((r) => r.category))];
    return ['Tất cả', ...unique];
  } catch (err) {
    console.warn('Network error fetching categories. Returning ["Tất cả"].', err);
    return ['Tất cả'];
  }
}

export async function getProductSlugs(): Promise<string[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('products')
      .select('slug')
      .eq('is_active', true);

    if (error) {
      console.warn('Error fetching slugs:', error.message);
      return [];
    }
    return (data ?? []).map((r) => r.slug);
  } catch (err) {
    console.warn('Network error fetching slugs. Returning empty list.', err);
    return [];
  }
}


