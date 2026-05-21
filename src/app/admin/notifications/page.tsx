import { getAdminNotifications, getAdminProfiles } from '@/lib/admin/data';
import NotificationsClient from './NotificationsClient';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const [notifications, profiles] = await Promise.all([
    getAdminNotifications(100),
    getAdminProfiles()
  ]);

  return (
    <div className={styles.page}>
      <NotificationsClient 
        initialNotifications={notifications} 
        profiles={profiles} 
      />
    </div>
  );
}
