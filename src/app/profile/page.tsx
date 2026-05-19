import Shell from '@/components/layout/Shell';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Settings } from 'lucide-react';
import styles from './profile.module.css';
import ProfileAvatar from './ProfileAvatar';

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

  // Dynamic statistics calculations
  const daysAccompanying = Math.max(
    1,
    Math.ceil((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
  );

  // Exact community posts count
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id);

  // Exact orders count
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

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
            <span className={styles.statsNum}>4</span>
            <span className={styles.statsLabel}>huy hiệu</span>
          </div>
        </div>

        <div className={styles.badgesSection}>
          <h3 className={styles.sectionTitle}>Huy hiệu</h3>
          <div className={styles.badgesGrid}>
            <div className={styles.badgeCard}>
              <div className={`${styles.badgeIconWrapper} ${styles.beginnerBg}`}>
                <Image
                  src="/images/badges/beginner.png"
                  alt="Người mới bắt đầu"
                  width={72}
                  height={72}
                  className={styles.badgeImg}
                  priority
                />
              </div>
              <strong className={styles.badgeName}>Người mới bắt đầu</strong>
              <span className={styles.badgeDesc}>Người thấu cảm</span>
            </div>

            <div className={styles.badgeCard}>
              <div className={`${styles.badgeIconWrapper} ${styles.listeningBg}`}>
                <Image
                  src="/images/badges/listening.png"
                  alt="Lắng nghe"
                  width={72}
                  height={72}
                  className={styles.badgeImg}
                  priority
                />
              </div>
              <strong className={styles.badgeName}>Lắng nghe</strong>
              <span className={styles.badgeDesc}>Người đồng hành</span>
            </div>

            <div className={styles.badgeCard}>
              <div className={`${styles.badgeIconWrapper} ${styles.loveBg}`}>
                <Image
                  src="/images/badges/love.png"
                  alt="Chia sẻ yêu thương"
                  width={72}
                  height={72}
                  className={styles.badgeImg}
                  priority
                />
              </div>
              <strong className={styles.badgeName}>Chia sẻ yêu thương</strong>
              <span className={styles.badgeDesc}>Huy hiệu khám phá</span>
            </div>

            <div className={styles.badgeCard}>
              <div className={`${styles.badgeIconWrapper} ${styles.musicBg}`}>
                <Image
                  src="/images/badges/music.png"
                  alt="Chăm sóc bản nhạc"
                  width={72}
                  height={72}
                  className={styles.badgeImg}
                  priority
                />
              </div>
              <strong className={styles.badgeName}>Chăm sóc bản nhạc</strong>
              <span className={styles.badgeDesc}>Lắng nghe thanh âm</span>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
