import { getAdminMedia } from '@/lib/admin/data';
import styles from '../admin.module.css';

export default async function AdminMediaPage() {
  const media = await getAdminMedia();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Thư viện phương tiện</h1>
          <p>Tổng hợp hình ảnh và âm thanh đang được tham chiếu trong sản phẩm và nhạc nền.</p>
        </div>
      </header>

      <section className={styles.mediaGrid}>
        {media.map((asset) => (
          <article key={asset.id} className={`${styles.card} ${styles.mediaCard}`}>
            <div className={styles.mediaPreview}>
              {asset.type === 'image' ? (
                <img src={asset.url} alt={asset.title} />
              ) : asset.type === 'audio' ? (
                <audio controls src={asset.url} />
              ) : (
                <span>{asset.type}</span>
              )}
            </div>
            <div className={styles.mediaBody}>
              <strong>{asset.title}</strong>
              <span>{asset.source} / {asset.type}</span>
              <a href={asset.url} target="_blank" rel="noreferrer" className={styles.truncate}>
                {asset.url}
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
