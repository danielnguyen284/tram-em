import type { Comment, PopularTag, Post } from '@/types/database';
import {
  DEFAULT_COMMUNITY_MODERATION_TERMS,
  evaluateCommunityContent,
  type CommunityModerationTerm,
} from '@/lib/community/moderation';
import { createAdminSupabaseClient } from '@/lib/admin/supabase';
import { createClient } from '@/utils/supabase/server';

const adminSupabase = createAdminSupabaseClient();

export const COMMUNITY_POSTS_PAGE_SIZE = 10;

async function getModerationTermsForEvaluation(): Promise<CommunityModerationTerm[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('community_moderation_terms')
      .select('term, action, is_active')
      .eq('is_active', true);

    if (error || !data) return DEFAULT_COMMUNITY_MODERATION_TERMS;
    return data as CommunityModerationTerm[];
  } catch {
    return DEFAULT_COMMUNITY_MODERATION_TERMS;
  }
}

type GetPostsOptions = {
  limit?: number;
  offset?: number;
  tag?: string;
};

function normalizeTagFilter(tag?: string) {
  const value = String(tag ?? '').trim();
  return value && value !== 'Tất cả' ? value.replace(/^#/, '') : null;
}

function commentsCountFromJoin(value: unknown) {
  return (value as { count: number }[] | undefined)?.[0]?.count ?? 0;
}

function enrichPost(post: Post & { comments?: unknown }, likedPostIds: Set<string>): Post {
  return {
    ...post,
    author: post.author ?? undefined,
    comments_count: commentsCountFromJoin(post.comments),
    liked_by_user: likedPostIds.has(post.id),
  };
}

export async function getPosts(options: GetPostsOptions = {}): Promise<Post[]> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const limit = options.limit ?? COMMUNITY_POSTS_PAGE_SIZE;
    const offset = options.offset ?? 0;
    const tag = normalizeTagFilter(options.tag);

    const { data, error } = await supabase
      .rpc('get_viral_posts', {
        offset_num: offset,
        limit_num: limit,
        tag_filter: tag || null,
      })
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, display_name, avatar_url, gender),
        comments(count)
      `);

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

    return (data ?? []).map((post: any) => enrichPost(post as Post & { comments?: unknown }, likedPostIds));
  } catch (err) {
    console.warn('Network error fetching posts. Returning empty list.', err);
    return [];
  }
}

export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, display_name, avatar_url, gender),
        comments(count)
      `)
      .eq('id', postId)
      .eq('moderation_status', 'approved')
      .maybeSingle();

    if (error || !data) return null;

    let likedPostIds = new Set<string>();
    if (user) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      likedPostIds = new Set((likes ?? []).map((l) => l.post_id));
    }

    return enrichPost(data as Post & { comments?: unknown }, likedPostIds);
  } catch {
    return null;
  }
}

export async function getPopularTags(limit = 8): Promise<PopularTag[]> {
  try {
    const supabase = await createClient();
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('posts')
      .select('tags, likes_count, created_at, comments(count)')
      .eq('moderation_status', 'approved')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(250);

    if (error) {
      console.warn('Error fetching popular tags:', error.message);
      return [];
    }

    const tagStats = new Map<string, { tag: string; posts_count: number; hot_score: number }>();
    const now = Date.now();

    (data ?? []).forEach((post) => {
      const tags = Array.isArray(post.tags) ? post.tags : [];
      const ageHours = Math.max(1, (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60));
      const recencyBoost = Math.max(0.25, 1 - ageHours / (14 * 24));
      const commentCount = commentsCountFromJoin(post.comments);
      const postScore = 4 * recencyBoost + Number(post.likes_count ?? 0) + commentCount * 2;

      tags.forEach((rawTag) => {
        const tag = String(rawTag).trim();
        if (!tag) return;

        const key = tag.toLowerCase();
        const current = tagStats.get(key) ?? { tag, posts_count: 0, hot_score: 0 };
        current.posts_count += 1;
        current.hot_score += postScore;
        tagStats.set(key, current);
      });
    });

    return [...tagStats.values()]
      .sort((a, b) => b.hot_score - a.hot_score || b.posts_count - a.posts_count || a.tag.localeCompare(b.tag))
      .slice(0, limit)
      .map((tag) => ({
        ...tag,
        hot_score: Math.round(tag.hot_score),
      }));
  } catch (err) {
    console.warn('Network error fetching popular tags. Returning empty list.', err);
    return [];
  }
}

export async function createPost(content: string, imageUrl?: string, tags?: string[]): Promise<Post> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const moderationTerms = await getModerationTermsForEvaluation();
  const moderation = evaluateCommunityContent(content, moderationTerms);

  if (moderation.status === 'blocked') {
    throw new Error('Nội dung có từ ngữ không được phép đăng trong cộng đồng.');
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content,
      image_url: imageUrl ?? null,
      tags: tags ?? [],
      moderation_status: moderation.status,
      moderation_reason: moderation.reason,
      moderation_matches: moderation.matches,
    })
    .select('*, author:profiles!posts_author_id_fkey(id, display_name, avatar_url)')
    .single();

  if (error) throw error;
  return data as Post;
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

    // Generate notification
    try {
      const { data: post } = await supabase
        .from('posts')
        .select('author_id, content')
        .eq('id', postId)
        .single();

      if (post && post.author_id && post.author_id !== user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        const userName = profile?.display_name || user.email?.split('@')[0] || 'Ai đó';

        await adminSupabase.from('notifications').insert({
          user_id: post.author_id,
          icon: 'heart',
          title: 'Cộng đồng',
          body: `${userName} đã thích bài viết của bạn: "${post.content.substring(0, 40)}${post.content.length > 40 ? '...' : ''}"`,
          href: `/community/post/${postId}`,
          is_read: false,
        });
      }
    } catch (notifErr) {
      console.warn('Failed to send post like notification:', notifErr);
    }

    return true; // liked
  }
}

export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(id, display_name, avatar_url, gender)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn(`Error fetching comments for ${postId}:`, error.message);
      return [];
    }

    let likedCommentIds = new Set<string>();
    if (user) {
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id);
      likedCommentIds = new Set((likes ?? []).map((l) => l.comment_id));
    }

    return (data ?? []).map((c) => ({
      ...c,
      author: c.author ?? undefined,
      liked_by_user: likedCommentIds.has(c.id),
    }));
  } catch (err) {
    console.warn(`Network error fetching comments for ${postId}. Returning empty list.`, err);
    return [];
  }
}

export async function createComment(postId: string, content: string, parentId?: string | null): Promise<Comment> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const moderationTerms = await getModerationTermsForEvaluation();
  const moderation = evaluateCommunityContent(content, moderationTerms);
  if (moderation.status !== 'approved') {
    throw new Error('Bình luận chứa từ ngữ cần kiểm duyệt nên chưa thể đăng.');
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .eq('moderation_status', 'approved')
    .maybeSingle();
  if (!post) throw new Error('Bài viết không tồn tại hoặc chưa được duyệt.');

  if (parentId) {
    const { data: parent } = await supabase
      .from('comments')
      .select('id')
      .eq('id', parentId)
      .eq('post_id', postId)
      .maybeSingle();
    if (!parent) throw new Error('Bình luận gốc không tồn tại.');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      parent_id: parentId ?? null,
      content,
    })
    .select('*, author:profiles!comments_author_id_fkey(id, display_name, avatar_url)')
    .single();

  if (error) throw error;

  // Generate notification
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    const userName = profile?.display_name || user.email?.split('@')[0] || 'Ai đó';

    if (parentId) {
      // Reply notification
      const { data: parent } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', parentId)
        .single();
      if (parent && parent.author_id && parent.author_id !== user.id) {
        await adminSupabase.from('notifications').insert({
          user_id: parent.author_id,
          icon: 'message',
          title: 'Bình luận mới',
          body: `${userName} đã trả lời bình luận của bạn: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
          href: `/community/post/${postId}#comment-${data.id}`,
          is_read: false,
        });
      }
    } else {
      // Top-level comment notification
      const { data: postDetail } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single();
      if (postDetail && postDetail.author_id && postDetail.author_id !== user.id) {
        await adminSupabase.from('notifications').insert({
          user_id: postDetail.author_id,
          icon: 'message',
          title: 'Bình luận mới',
          body: `${userName} đã bình luận về bài viết của bạn: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
          href: `/community/post/${postId}#comment-${data.id}`,
          is_read: false,
        });
      }
    }
  } catch (notifErr) {
    console.warn('Failed to send comment notification:', notifErr);
  }

  return { ...data, author: data.author ?? undefined } as Comment;
}

export async function toggleCommentLike(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already liked
  const { data: existing } = await supabase
    .from('comment_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('comment_id', commentId)
    .single();

  if (existing) {
    await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('comment_id', commentId);
    return false; // unliked
  } else {
    await supabase
      .from('comment_likes')
      .insert({ user_id: user.id, comment_id: commentId });

    // Generate notification
    try {
      const { data: comment } = await supabase
        .from('comments')
        .select('author_id, content, post_id')
        .eq('id', commentId)
        .single();

      if (comment && comment.author_id && comment.author_id !== user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        const userName = profile?.display_name || user.email?.split('@')[0] || 'Ai đó';

        await adminSupabase.from('notifications').insert({
          user_id: comment.author_id,
          icon: 'heart',
          title: 'Cộng đồng',
          body: `${userName} đã thích bình luận của bạn: "${comment.content.substring(0, 40)}${comment.content.length > 40 ? '...' : ''}"`,
          href: `/community/post/${comment.post_id}#comment-${commentId}`,
          is_read: false,
        });
      }
    } catch (notifErr) {
      console.warn('Failed to send comment like notification:', notifErr);
    }

    return true; // liked
  }
}

