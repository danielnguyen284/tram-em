import { games } from '@/data/games';
import styles from '../admin.module.css';

export default function AdminGamesPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Quản lý trò chơi</h1>
          <p>Mỗi trò chơi là một đường dẫn riêng, nên trang quản trị đang theo dõi siêu dữ liệu ở mức chỉ đọc.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Trò chơi hiện có</h2>
          <span className={styles.muted}>{games.length} đường dẫn</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Danh mục</th>
              <th>Đường dẫn</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.href}>
                <td>{game.title}</td>
                <td>{game.category}</td>
                <td>{game.href}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
