import Shell from '@/components/layout/Shell';
import { getPosts } from '@/lib/supabase/community';
import CommunityClient from './CommunityClient';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const posts = await getPosts();

  // Get current user profile if logged in
  let currentUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    currentUser = profile ? {
      id: user.id,
      name: profile.display_name ?? 'Ẩn danh',
      avatar: profile.avatar_url ?? `https://i.pravatar.cc/150?u=${user.id}`,
    } : null;
  }

  return (
    <Shell>
      <CommunityClient initialPosts={posts} currentUser={currentUser} />
    </Shell>
  );
}
