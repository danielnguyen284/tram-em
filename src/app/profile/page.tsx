import Shell from '@/components/layout/Shell';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Settings } from 'lucide-react';
import styles from './profile.module.css';
import ProfileAvatar from './ProfileAvatar';
import { BADGES } from '@/lib/badges';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const fallbackAvatar =
    user.user_metadata?.gender === 'female'
      ? '/images/avatar-default-female.png'
      : '/images/avatar-default-male.png';
  const displayName = profile?.display_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0];

  // Dynamic statistics
  const daysAccompanying = Math.max(
    1,
    Math.ceil((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
  );

  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id);

  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch earned badges from DB (client will compute/unlock new ones to trigger toasts)
  const { data: badgesData } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user.id);
  
  const earnedBadgeIds = (badgesData || []).map(b => b.badge_id);
  const earnedSet = new Set(earnedBadgeIds);

  return (
    <Shell>
      <section className={styles.page}>
        <h1 className={styles.pageTitle}>Hồ sơ của bạn</h1>

        <div className={styles.header}>
          <ProfileAvatar initialAvatar={profile?.avatar_url ?? fallbackAvatar} />
          <div className={styles.headerInfo}>
            <h2>{displayName}</h2>
            <p className={styles.welcomeText}>Cảm ơn bạn đã đồng hành cùng trạm êm 💜</p>
          </div>
          <Link href="/account/security" className={styles.settingsBtn}>
            <Settings size={16} />
            <span>Thiết lập tài khoản</span>
          </Link>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statsCard}>
            <span className={styles.statsNum}>{daysAccompanying}</span>
            <span className={styles.statsLabel}>ngày đồng hành</span>
          </div>
          <div className={styles.statsCard}>
            <span className={styles.statsNum}>{postsCount ?? 0}</span>
            <span className={styles.statsLabel}>bài viết</span>
          </div>
          <div className={styles.statsCard}>
            <span className={styles.statsNum}>{ordersCount ?? 0}</span>
            <span className={styles.statsLabel}>đơn hàng</span>
          </div>
          <div className={styles.statsCard}>
            <span className={styles.statsNum}>{earnedSet.size}</span>
            <span className={styles.statsLabel}>huy hiệu</span>
          </div>
        </div>

        <div className={styles.badgesSection}>
          <h3 className={styles.sectionTitle}>Huy hiệu</h3>
          <div className={styles.badgesGrid}>
            {BADGES.map((badge) => {
              const earned = earnedSet.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`${styles.badgeCard} ${earned ? '' : styles.badgeLocked}`}
                  title={earned ? badge.description : `Chưa mở khóa — ${badge.description}`}
                >
                  <div className={`${styles.badgeIconWrapper} ${styles[badge.bgClass]}`}>
                    {badge.image ? (
                      <Image 
                        src={badge.image} 
                        alt={badge.name} 
                        width={64} 
                        height={64} 
                        className={styles.badgeImg} 
                      />
                    ) : (
                      <span className={styles.badgeEmoji} aria-hidden="true">
                        {badge.emoji}
                      </span>
                    )}
                    {!earned && <span className={styles.lockOverlay}>🔒</span>}
                  </div>
                  <strong className={styles.badgeName}>{badge.name}</strong>
                  <span className={styles.badgeDesc}>{badge.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Shell>
  );
}
