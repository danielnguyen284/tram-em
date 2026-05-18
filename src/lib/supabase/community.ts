import type { Post, Comment } from '@/types/database';
import { createClient } from '@/utils/supabase/server';

export async function getPosts(): Promise<Post[]> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, display_name, avatar_url),
        comments(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching posts:', error.message);
      return [];
    }

    // Check which posts the current user has liked
    let likedPostIds = new Set<string>();
    if (user) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      likedPostIds = new Set((likes ?? []).map((l) => l.post_id));
    }

    return (data ?? []).map((post) => ({
      ...post,
      author: post.author ?? undefined,
      comments_count: (post.comments as unknown as { count: number }[])?.[0]?.count ?? 0,
      liked_by_user: likedPostIds.has(post.id),
    }));
  } catch (err) {
    console.warn('Network error fetching posts. Returning empty list.', err);
    return [];
  }
}

export async function createPost(content: string, imageUrl?: string, tags?: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content,
      image_url: imageUrl ?? null,
      tags: tags ?? [],
    })
    .select('*, author:profiles!posts_author_id_fkey(id, display_name, avatar_url)')
    .single();

  if (error) throw error;
  return data;
}

export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already liked
  const { data: existing } = await supabase
    .from('post_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single();

  if (existing) {
    await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);
    return false; // unliked
  } else {
    await supabase
      .from('post_likes')
      .insert({ user_id: user.id, post_id: postId });
    return true; // liked
  }
}

export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(id, display_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn(`Error fetching comments for ${postId}:`, error.message);
      return [];
    }
    return (data ?? []).map((c) => ({ ...c, author: c.author ?? undefined }));
  } catch (err) {
    console.warn(`Network error fetching comments for ${postId}. Returning empty list.`, err);
    return [];
  }
}

export async function createComment(postId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content,
    })
    .select('*, author:profiles!comments_author_id_fkey(id, display_name, avatar_url)')
    .single();

  if (error) throw error;
  return { ...data, author: data.author ?? undefined };
}

