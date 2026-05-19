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

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    let t = h += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function getFeaturedSounds(limit = 4): Promise<Sound[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('sounds')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.warn('Error fetching featured sounds:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    // Format date string in Asia/Ho_Chi_Minh timezone (GMT+7)
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(new Date());

    const rng = seededRandom(dateStr);
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, limit);
  } catch (err) {
    console.warn('Network error fetching featured sounds. Returning empty fallback array.', err);
    return [];
  }
}



