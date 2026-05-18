import Shell from '@/components/layout/Shell';
import { getSounds, getSoundCategories } from '@/lib/supabase/sounds';
import SoundscapeClient from './SoundscapeClient';

export const dynamic = 'force-dynamic';

export default async function SoundscapePage() {
  const [sounds, categories] = await Promise.all([
    getSounds(),
    getSoundCategories(),
  ]);

  return (
    <Shell>
      <SoundscapeClient sounds={sounds} categories={categories} />
    </Shell>
  );
}
