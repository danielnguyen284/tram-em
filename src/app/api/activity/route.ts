import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { computeEarnedBadges } from '@/lib/badge-engine';
import { BADGES } from '@/lib/badges';

// Valid activity types the client can log
const VALID_ACTIVITIES = ['soundscape_play', 'breathing_complete', 'game_play'] as const;
type ActivityType = (typeof VALID_ACTIVITIES)[number];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { activity_type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { activity_type } = body;

  if (!activity_type || !VALID_ACTIVITIES.includes(activity_type as ActivityType)) {
    return NextResponse.json({ error: 'Invalid activity_type' }, { status: 400 });
  }

  // Upsert the activity log
  const { error } = await supabase.from('user_activity_logs').upsert(
    { user_id: user.id, activity_type },
    { onConflict: 'user_id,activity_type' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute newly unlocked badges after this activity
  const { newlyUnlocked } = await computeEarnedBadges(user.id, supabase);

  // Map badge IDs to full badge data for the client notification
  const newBadgeData = newlyUnlocked.map((id) => {
    const badge = BADGES.find((b) => b.id === id);
    return { 
      id, 
      name: badge?.name ?? id, 
      emoji: badge?.emoji ?? '🏅',
      image: badge?.image ?? '/images/badges/music.png',
      description: badge?.description ?? 'Bạn đã mở khóa một huy hiệu bí ẩn.'
    };
  });

  return NextResponse.json({ ok: true, newBadges: newBadgeData });
}
