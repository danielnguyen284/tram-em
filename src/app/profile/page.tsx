import Shell from '@/components/layout/Shell';
import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import styles from './profile.module.css';

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

  const gender = user.user_metadata?.gender === 'female' ? 'Nữ' : 'Nam';
  const fallbackAvatar =
    user.user_metadata?.gender === 'female'
      ? '/images/avatar-default-female.png'
      : '/images/avatar-default-male.png';
  const displayName = profile?.display_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0];

  return (
    <Shell>
      <section className={styles.page}>
        <div className={styles.header}>
          <span className={styles.avatar}>
            <Image src={profile?.avatar_url ?? fallbackAvatar} alt="" fill sizes="84px" className={styles.avatarImg} />
          </span>
          <div>
            <p className={styles.kicker}>Hồ sơ cá nhân</p>
            <h1>{displayName}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.panel}>
            <span>Tên hiển thị</span>
            <strong>{displayName}</strong>
          </div>
          <div className={styles.panel}>
            <span>Giới tính avatar mặc định</span>
            <strong>{gender}</strong>
          </div>
          <div className={styles.panel}>
            <span>Trạng thái email</span>
            <strong>{user.email_confirmed_at ? 'Đã xác minh' : 'Chưa xác minh'}</strong>
          </div>
        </div>
      </section>
    </Shell>
  );
}
