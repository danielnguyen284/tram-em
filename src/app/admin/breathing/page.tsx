import styles from '../admin.module.css';

const techniques = [
  { name: '4-7-8', phases: 'Hít 4s / Giữ 7s / Thở 8s', status: 'Trong mã nguồn' },
  { name: 'Box Breathing', phases: 'Hít 4s / Giữ 4s / Thở 4s / Giữ 4s', status: 'Trong mã nguồn' },
  { name: 'Thở bụng', phases: 'Hít 4s / Thở 6s', status: 'Trong mã nguồn' },
];

export default function AdminBreathingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Quản lý nhịp thở</h1>
          <p>Các kỹ thuật thở hiện tại ít thay đổi, tạm thời được giữ trong mã nguồn.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Kỹ thuật hiện có</h2>
          <span className={styles.muted}>Chỉ đọc</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Chu kỳ</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {techniques.map((technique) => (
              <tr key={technique.name}>
                <td>{technique.name}</td>
                <td>{technique.phases}</td>
                <td>{technique.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
