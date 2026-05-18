import Shell from '@/components/layout/Shell';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import styles from './security.module.css';

export const dynamic = 'force-dynamic';

export default async function AccountSecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const providerNames = user.identities?.map((identity) => identity.provider).join(', ') || 'Email';

  return (
    <Shell>
      <section className={styles.page}>
        <div className={styles.header}>
          <p>Tài khoản & bảo mật</p>
          <h1>Thông tin đăng nhập</h1>
        </div>

        <div className={styles.list}>
          <div className={styles.row}>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div className={styles.row}>
            <span>Phương thức đăng nhập</span>
            <strong>{providerNames}</strong>
          </div>
          <div className={styles.row}>
            <span>Xác minh email</span>
            <strong>{user.email_confirmed_at ? 'Đã xác minh' : 'Chưa xác minh'}</strong>
          </div>
        </div>
      </section>
    </Shell>
  );
}
