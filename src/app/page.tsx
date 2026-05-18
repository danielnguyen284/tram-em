import Shell from '@/components/layout/Shell';
import { getFeaturedSounds } from '@/lib/supabase/sounds';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const featuredSounds = await getFeaturedSounds(4);

  return (
    <Shell>
      <HomeClient featuredSounds={featuredSounds} />
    </Shell>
  );
}
