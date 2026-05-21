import { getAdminSounds } from '@/lib/admin/data';
import SoundsClient from './SoundsClient';
import styles from '../admin.module.css';

export default async function AdminSoundsPage() {
  const sounds = await getAdminSounds();

  return (
    <div className={styles.page}>
      <SoundsClient initialSounds={sounds} />
    </div>
  );
}
