import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeEarnedBadges } from '@/lib/badge-engine';
import { BADGES } from '@/lib/badges';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { newlyUnlocked } = await computeEarnedBadges(user.id, supabase);

    if (newlyUnlocked.length === 0) {
      return NextResponse.json({ ok: true, newBadges: [] });
    }

    const newBadgeData = newlyUnlocked.map((id) => {
      const badge = BADGES.find((b) => b.id === id);
      return {
        id,
        name: badge?.name ?? id,
        emoji: badge?.emoji ?? '🏅',
        image: badge?.image ?? '/images/badges/music.png',
        description: badge?.description ?? 'Bạn đã mở khóa một huy hiệu bí ẩn.',
      };
    });

    return NextResponse.json({ ok: true, newBadges: newBadgeData });
  } catch (error: any) {
    console.error('Error checking badges:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
