import type { Product, ProductCategory } from '@/types/database';
import { createPublicClient } from '@/utils/supabase/server';

const productPublicFields = [
  'id',
  'slug',
  'name',
  'category_id',
  'category',
  'price',
  'old_price',
  'description',
  'details',
  'images',
  'tags',
  'stock',
  'sales_count',
  'is_active',
  'created_at',
  'updated_at',
].join(',');

export async function getProducts(category?: string): Promise<Product[]> {
  try {
    const supabase = createPublicClient();

    let query = supabase
      .from('products')
      .select(productPublicFields)
      .order('created_at', { ascending: false });

    if (category && category !== 'Tất cả') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching products:', error.message);
      return [];
    }
    return (data as unknown as Product[]) ?? [];
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
      .select(productPublicFields)
      .eq('slug', slug)
      .single();

    if (error) {
      console.warn(`Error fetching product by slug ${slug}:`, error.message);
      return null;
    }
    return data as unknown as Product | null;
  } catch (err) {
    console.warn(`Network error fetching product ${slug}. Returning null.`, err);
    return null;
  }
}

export async function getProductCategories(): Promise<string[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('product_categories')
      .select('name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.warn('Error fetching product categories:', error.message);
      return getProductCategoriesFromProducts();
    }
    const unique = [...new Set((data ?? []).map((r) => r.name))];
    return ['Tất cả', ...unique];
  } catch (err) {
    console.warn('Network error fetching product categories. Falling back to product rows.', err);
    return getProductCategoriesFromProducts();
  }
}

async function getProductCategoriesFromProducts(): Promise<string[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true);

    if (error) return ['Tất cả'];
    const unique = [...new Set((data ?? []).map((r) => r.category))];
    return ['Tất cả', ...unique];
  } catch {
    return ['Tất cả'];
  }
}

export async function getProductCategoryRows(): Promise<ProductCategory[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.warn('Error fetching product category rows:', error.message);
      return [];
    }
    return (data as unknown as ProductCategory[]) ?? [];
  } catch (err) {
    console.warn('Network error fetching product category rows. Returning empty list.', err);
    return [];
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
