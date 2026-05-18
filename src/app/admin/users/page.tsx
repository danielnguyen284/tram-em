import { updateProfileRole } from '@/app/admin/actions';
import { getAdminProfiles } from '@/lib/admin/data';
import { timeAgo } from '@/utils/format';
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

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Danh sách tài khoản</h2>
          <span className={styles.muted}>{profiles.length} người dùng</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên hiển thị</th>
              <th>User ID</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.display_name ?? 'Chưa đặt tên'}</td>
                <td className={styles.truncate}>{profile.id}</td>
                <td>
                  <span className={`${styles.status} ${profile.role === 'admin' ? '' : styles.statusOff}`}>
                    {profile.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                  </span>
                </td>
                <td>{timeAgo(profile.created_at)}</td>
                <td>
                  <form action={updateProfileRole} className={styles.actions}>
                    <input type="hidden" name="id" value={profile.id} />
                    <select name="role" defaultValue={profile.role ?? 'customer'} className={styles.inlineSelect}>
                      <option value="customer">Khách hàng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                    <button type="submit" className={styles.ghostButton}>Lưu quyền</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
