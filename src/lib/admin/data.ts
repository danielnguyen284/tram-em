import type { CommunityModerationTerm, MediaAsset, Order, Post, Product, ProductCategory, Profile, Sound } from '@/types/database';
import { createAdminSupabaseClient } from './supabase';

async function safeCount(table: string) {
  try {
    const supabase = createAdminSupabaseClient();
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safeSelect<T>(table: string, query: (client: ReturnType<typeof createAdminSupabaseClient>) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await query(supabase);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getAdminOverview() {
  const [
    products,
    sounds,
    posts,
    comments,
    chats,
    notifications,
    users,
    orders,
  ] = await Promise.all([
    safeCount('products'),
    safeCount('sounds'),
    safeCount('posts'),
    safeCount('comments'),
    safeCount('chat_threads'),
    safeCount('notifications'),
    safeCount('profiles'),
    safeCount('orders'),
  ]);

  const [recentProducts, recentSounds, recentPosts, recentOrders] = await Promise.all([
    getAdminProducts(5),
    getAdminSounds(5),
    getAdminPosts(5),
    getAdminOrders(5),
  ]);

  return {
    counts: {
      products,
      sounds,
      posts,
      comments,
      chats,
      notifications,
      users,
      orders,
    },
    recentProducts,
    recentSounds,
    recentPosts,
    recentOrders,
  };
}

export async function getAdminProducts(limit?: number): Promise<Product[]> {
  return safeSelect<Product>('products', (supabase) => {
    let query = supabase.from('products').select('*').order('updated_at', { ascending: false });
    if (limit) query = query.limit(limit);
    return query;
  });
}

export async function getAdminProductCategories(): Promise<ProductCategory[]> {
  return safeSelect<ProductCategory>('product_categories', (supabase) =>
    supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  );
}

export function resolveAudioUrl(url: string, name: string): string {
  if (url && url.includes('pixabay.com')) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('mưa')) return '/audio/rain.wav';
    if (lowerName.includes('rừng') || lowerName.includes('hồ')) return '/audio/forest.wav';
    if (lowerName.includes('sóng') || lowerName.includes('ấm') || lowerName.includes('bể')) return '/audio/ocean.wav';
    if (lowerName.includes('suối') || lowerName.includes('năng lượng')) return '/audio/stream.wav';
    if (lowerName.includes('gió') || lowerName.includes('thiền')) return '/audio/bowl.wav';
    if (lowerName.includes('lửa') || lowerName.includes('truyện') || lowerName.includes('núi')) return '/audio/campfire.wav';
  }
  return url;
}

export async function getAdminSounds(limit?: number): Promise<Sound[]> {
  const sounds = await safeSelect<Sound>('sounds', (supabase) => {
    let query = supabase.from('sounds').select('*').order('sort_order', { ascending: true });
    if (limit) query = query.limit(limit);
    return query;
  });

  return sounds.map((s) => ({
    ...s,
    audio_url: resolveAudioUrl(s.audio_url, s.name),
  }));
}

export async function getAdminPosts(limit?: number): Promise<Post[]> {
  return safeSelect<Post>('posts', (supabase) => {
    let query = supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role, created_at), comments(count)')
      .order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    return query;
  }).then((posts) =>
    posts.map((post) => ({
      ...post,
      author: post.author ?? undefined,
      comments_count: (post as unknown as { comments?: { count: number }[] }).comments?.[0]?.count ?? 0,
    })),
  );
}

export async function getCommunityModerationTerms(): Promise<CommunityModerationTerm[]> {
  return safeSelect<CommunityModerationTerm>('community_moderation_terms', (supabase) =>
    supabase
      .from('community_moderation_terms')
      .select('*')
      .order('action', { ascending: true })
      .order('term', { ascending: true }),
  );
}

export async function getAdminOrders(limit?: number, status?: string): Promise<Order[]> {
  return safeSelect<Order>('orders', (supabase) => {
    let query = supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });
    if (status && status !== 'all') query = query.eq('status', status);
    if (limit) query = query.limit(limit);
    return query;
  });
}

export async function getAdminNotifications(limit?: number) {
  return safeSelect('notifications', (supabase) => {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    return query;
  });
}

export async function getAdminProfiles(): Promise<Profile[]> {
  return safeSelect<Profile>('profiles', (supabase) =>
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
  );
}

export async function getAdminMedia(): Promise<MediaAsset[]> {
  const [products, sounds] = await Promise.all([getAdminProducts(), getAdminSounds()]);
  const media: MediaAsset[] = [];

  products.forEach((product) => {
    product.images.forEach((url, index) => {
      media.push({
        id: `${product.id}-image-${index}`,
        source: 'product',
        title: product.name,
        type: 'image',
        url,
        created_at: product.created_at,
      });
    });
  });

  sounds.forEach((sound) => {
    if (sound.image_url) {
      media.push({
        id: `${sound.id}-image`,
        source: 'sound',
        title: sound.name,
        type: 'image',
        url: sound.image_url,
        created_at: sound.created_at,
      });
    }

    media.push({
      id: `${sound.id}-audio`,
      source: 'sound',
      title: sound.name,
      type: 'audio',
      url: sound.audio_url,
      created_at: sound.created_at,
    });
  });

  return media;
}
