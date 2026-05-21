import { getAdminProfiles } from '@/lib/admin/data';
import UsersTable from './UsersTable';
import styles from '../admin.module.css';

export default async function AdminUsersPage() {
  const profiles = await getAdminProfiles();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Người dùng và phân quyền</h1>
          <p>Hệ thống đang sử dụng 2 vai trò: quản trị viên (admin) và khách hàng (customer). Khách chưa đăng nhập được xem là khách vãng lai (guest).</p>
        </div>
      </header>

      <UsersTable initialProfiles={profiles} />
    </div>
  );
}
