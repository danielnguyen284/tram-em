import { saveSound, toggleSoundActive } from '@/app/admin/actions';
import { getAdminSounds } from '@/lib/admin/data';
import styles from '../admin.module.css';

export default async function AdminSoundsPage() {
  const sounds = await getAdminSounds();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Quản lý âm thanh</h1>
          <p>Thêm, sửa và ẩn hiện các track đang dùng trên /soundscape và trang chủ.</p>
        </div>
      </header>

      <section className={styles.split}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Danh sách track</h2>
            <span className={styles.muted}>{sounds.length} mục</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Audio</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sounds.map((sound) => (
                <tr key={sound.id}>
                  <td>{sound.name}</td>
                  <td>{sound.category}</td>
                  <td className={styles.truncate}>{sound.audio_url}</td>
                  <td>
                    <span className={`${styles.status} ${!sound.is_active ? styles.statusOff : ''}`}>
                      {sound.is_active ? 'Đang hiện' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td>
                    <form action={toggleSoundActive}>
                      <input type="hidden" name="id" value={sound.id} />
                      <input type="hidden" name="is_active" value={String(sound.is_active)} />
                      <button className={styles.ghostButton} type="submit">
                        {sound.is_active ? 'Ẩn' : 'Hiện'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Thêm track</h2>
          </div>
          <form action={saveSound} className={styles.formGrid}>
            <label>
              Tên
              <input name="name" required />
            </label>
            <label>
              Danh mục
              <input name="category" required />
            </label>
            <label>
              Mood
              <input name="mood" />
            </label>
            <label>
              Thời lượng
              <input name="duration" />
            </label>
            <label>
              Icon
              <input name="icon" placeholder="rain, forest, music" />
            </label>
            <label>
              Thứ tự
              <input name="sort_order" type="number" defaultValue={0} />
            </label>
            <label className={styles.fieldFull}>
              Image URL
              <input name="image_url" />
            </label>
            <label className={styles.fieldFull}>
              Audio URL
              <input name="audio_url" required />
            </label>
            <label className={styles.checkbox}>
              <input name="is_active" type="checkbox" defaultChecked />
              Đang hiển thị
            </label>
            <div className={styles.formFooter}>
              <button type="submit" className={styles.button}>Lưu track</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
