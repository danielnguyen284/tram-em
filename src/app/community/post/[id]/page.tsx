import Shell from '@/components/layout/Shell';
import { getPostById } from '@/lib/supabase/community';
import CommunityClient from '../../CommunityClient';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;
  const post = await getPostById(postId);

  if (!post) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
        initialPosts={[post]}
        currentUser={currentUser}
        initialPopularTags={[]}
        initialHasMore={false}
        isSinglePostView={true}
      />
    </Shell>
  );
}
