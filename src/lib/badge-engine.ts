import type { SupabaseClient } from '@supabase/supabase-js';
import type { BadgeId } from './badges';

export type BadgeEngineResult = {
  /** All currently earned badge IDs (for profile display) */
  earned: BadgeId[];
  /** Badges newly unlocked in this evaluation (for notifications) */
  newlyUnlocked: BadgeId[];
};

/**
 * Computes which badges the user has earned, upserts new ones into DB,
 * and returns both the full earned list and newly unlocked ones.
 */
export async function computeEarnedBadges(
  userId: string,
  supabase: SupabaseClient
): Promise<BadgeEngineResult> {
  // ── Fetch chat thread IDs first (needed for messages count) ──────────────
  const { data: threadRows } = await supabase
    .from('chat_threads')
    .select('id')
    .eq('user_id', userId);

  const threadIds = (threadRows ?? []).map((t) => t.id);

  // ── Fetch remaining data in parallel ──────────────────────────────────────
  const [
    { count: postsCount },
    { count: ordersCount },
    { count: commentsCount },
    { count: chatMessagesCount },
    { data: existingBadges },
    { data: userProfile },
    { data: activityLogs },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId),

    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId),

    threadIds.length > 0
      ? supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'user')
          .in('thread_id', threadIds)
      : Promise.resolve({ count: 0, data: null, error: null }),

    supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId),

    supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .maybeSingle(),

    supabase
      .from('user_activity_logs')
      .select('activity_type')
      .eq('user_id', userId),
  ]);

  // ── Compute total likes received by user ──────────────────────────────────
  const { data: userPosts } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('author_id', userId);

  const totalLikesReceived = (userPosts ?? []).reduce(
    (sum, p) => sum + (p.likes_count ?? 0),
    0
  );

  // ── Days since registration ────────────────────────────────────────────────
  const createdAt = userProfile?.created_at
    ? new Date(userProfile.created_at)
    : new Date();
  const daysAccompanying = Math.ceil(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // ── Activity types already logged ──────────────────────────────────────────
  const activities = new Set((activityLogs ?? []).map((l) => l.activity_type));

  // ── Evaluate conditions ────────────────────────────────────────────────────
  const earned: BadgeId[] = [];

  // 1. Bước Đầu Tiên — always earned on sign-up
  earned.push('first_step');

  // 2. Kể Chuyện — posted at least 1 community post
  if ((postsCount ?? 0) >= 1) earned.push('storyteller');

  // 3. Giọng Của Mười — posted 10+ community posts
  if ((postsCount ?? 0) >= 10) earned.push('voice_of_ten');

  // 4. Trái Tim Ấm — received 10+ likes
  if (totalLikesReceived >= 10) earned.push('warm_heart');

  // 5. Người Lắng Nghe — played a soundscape
  if (activities.has('soundscape_play')) earned.push('listener');

  // 6. Hướng Dẫn Thở — completed a breathing session
  if (activities.has('breathing_complete')) earned.push('breathing_guide');

  // 7. Khám Phá Trò Chơi — played a game
  if (activities.has('game_play')) earned.push('game_explorer');

  // 8. Nhà Mua Sắm — placed at least 1 order
  if ((ordersCount ?? 0) >= 1) earned.push('shopper');

  // 9. Ân Nhân Trạm Êm — placed 3+ orders
  if ((ordersCount ?? 0) >= 3) earned.push('loyal_shopper');

  // 10. Bạn Của Em AI — sent at least 1 message to Em AI
  if ((chatMessagesCount ?? 0) >= 1) earned.push('ai_friend');

  // 11. Người Kết Nối — commented at least once
  if ((commentsCount ?? 0) >= 1) earned.push('commenter');

  // 12. Lữ Hành Lâu Năm — member for 30+ days
  if (daysAccompanying >= 30) earned.push('veteran');

  // ── Upsert newly earned badges ─────────────────────────────────────────────
  const existingSet = new Set((existingBadges ?? []).map((b) => b.badge_id));
  const newBadges = earned.filter((id) => !existingSet.has(id));

  if (newBadges.length > 0) {
    await supabase.from('user_badges').insert(
      newBadges.map((badge_id) => ({ user_id: userId, badge_id }))
    );
  }

  return { earned, newlyUnlocked: newBadges };
}
