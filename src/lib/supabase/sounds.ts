import type { Sound } from '@/types/database';
import { createPublicClient } from '@/utils/supabase/server';

export async function getSounds(category?: string): Promise<Sound[]> {
  try {
    const supabase = createPublicClient();

    let query = supabase
      .from('sounds')
      .select('*')
      .order('sort_order', { ascending: true });

    if (category && category !== 'Tất cả') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching sounds:', error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn('Network error fetching sounds. Returning empty fallback array.', err);
    return [];
  }
}

export async function getSoundCategories(): Promise<string[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('sounds')
      .select('category')
      .eq('is_active', true);

    if (error) {
      console.warn('Error fetching sound categories:', error.message);
      return ['Tất cả'];
    }
    const unique = [...new Set((data ?? []).map((r) => r.category))];
    return ['Tất cả', ...unique];
  } catch (err) {
    console.warn('Network error fetching sound categories. Returning ["Tất cả"].', err);
    return ['Tất cả'];
  }
}

export async function getFeaturedSounds(limit = 4): Promise<Sound[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('sounds')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.warn('Error fetching featured sounds:', error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn('Network error fetching featured sounds. Returning empty fallback array.', err);
    return [];
  }
}


