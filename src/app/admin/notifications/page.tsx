import { createNotification } from '@/app/admin/actions';
import { getAdminNotifications, getAdminProfiles } from '@/lib/admin/data';
import { timeAgo } from '@/utils/format';
import styles from '../admin.module.css';

export default async function AdminNotificationsPage() {
  const [notifications, profiles] = await Promise.all([getAdminNotifications(100), getAdminProfiles()]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Quản lý thông báo</h1>
          <p>Tạo thông báo cho một người dùng hoặc gửi tới tất cả khách hàng.</p>
        </div>
      </header>

      <section className={styles.split}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Thông báo gần đây</h2>
            <span className={styles.muted}>{notifications.length} mục</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Người dùng</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td className={styles.truncate}>{item.user_id}</td>
                  <td>
                    <span className={`${styles.status} ${item.is_read ? '' : styles.statusOff}`}>
                      {item.is_read ? 'Đã đọc' : 'Chưa đọc'}
                    </span>
                  </td>
                  <td>{timeAgo(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Tạo thông báo</h2>
          </div>
          <form action={createNotification} className={styles.formGrid}>
            <label className={styles.fieldFull}>
              Người nhận
              <select name="user_id" defaultValue="">
                <option value="">Tất cả khách hàng</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.display_name ?? profile.id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Icon
              <input name="icon" defaultValue="Bell" />
            </label>
            <label>
              Link
              <input name="href" placeholder="/soundscape" />
            </label>
            <label className={styles.fieldFull}>
              Tiêu đề
              <input name="title" required />
            </label>
            <label className={styles.fieldFull}>
              Nội dung
              <textarea name="body" required />
            </label>
            <div className={styles.formFooter}>
              <button type="submit" className={styles.button}>Gửi thông báo</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
