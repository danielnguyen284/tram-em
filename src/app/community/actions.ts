'use server';

import {
  COMMUNITY_POSTS_PAGE_SIZE,
  createComment,
  createPost,
  getComments,
  getPosts,
  toggleLike,
  toggleCommentLike,
} from '@/lib/supabase/community';
import { revalidatePath } from 'next/cache';

export async function saveCommunityPost(content: string, imageUrl?: string, tags?: string[]) {
  const data = await createPost(content, imageUrl ?? undefined, tags ?? []);
  revalidatePath('/community');
  return data;
}

export async function toggleCommunityLike(postId: string) {
  const result = await toggleLike(postId);
  revalidatePath('/community');
  return result;
}

export async function loadCommunityPosts(offset: number, tag?: string) {
  const posts = await getPosts({ offset, tag, limit: COMMUNITY_POSTS_PAGE_SIZE });
  return {
    posts,
    nextOffset: offset + posts.length,
    hasMore: posts.length === COMMUNITY_POSTS_PAGE_SIZE,
  };
}

export async function loadPostComments(postId: string) {
  return getComments(postId);
}

export async function savePostComment(postId: string, content: string, parentId?: string | null) {
  const data = await createComment(postId, content, parentId ?? null);
  revalidatePath('/community');
  return data;
}

export async function toggleCommunityCommentLike(commentId: string) {
  const result = await toggleCommentLike(commentId);
  revalidatePath('/community');
  return result;
}

