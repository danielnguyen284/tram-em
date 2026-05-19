import Shell from '@/components/layout/Shell';
import { COMMUNITY_POSTS_PAGE_SIZE, getPopularTags, getPosts } from '@/lib/supabase/community';
import CommunityClient from './CommunityClient';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [posts, popularTags] = await Promise.all([
    getPosts({ limit: COMMUNITY_POSTS_PAGE_SIZE }),
    getPopularTags(),
  ]);

  // Get current user profile if logged in
  let currentUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const fallbackAvatar =
      user.user_metadata?.gender === 'female'
        ? '/images/avatar-default-female.png'
        : '/images/avatar-default-male.png';

    currentUser = {
      id: user.id,
      name: profile?.display_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Ẩn danh',
      avatar: profile?.avatar_url ?? fallbackAvatar,
    };
  }

  return (
    <Shell>
      <CommunityClient
        initialPosts={posts}
        currentUser={currentUser}
        initialPopularTags={popularTags}
        initialHasMore={posts.length === COMMUNITY_POSTS_PAGE_SIZE}
      />
    </Shell>
  );
}
