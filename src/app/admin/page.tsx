import { getAdminOverview } from '@/lib/admin/data';
import { formatVnd, timeAgo } from '@/utils/format';
import Link from 'next/link';
import RecentOrdersTable from './RecentOrdersTable';
import styles from './admin.module.css';

export default async function AdminDashboardPage() {
  const overview = await getAdminOverview();
  const cards = [
    { label: 'Sản phẩm', value: overview.counts.products, href: '/admin/shop' },
    { label: 'Bài cộng đồng', value: overview.counts.posts, href: '/admin/community' },
    { label: 'Người dùng', value: overview.counts.users, href: '/admin/users' },
    { label: 'Đơn hàng', value: overview.counts.orders, href: '/admin/shop' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Tổng quan CMS</h1>
          <p>Theo dõi nội dung, cửa hàng, cộng đồng và người dùng của Trạm Êm.</p>
        </div>
      </header>

      <section className={styles.grid}>
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className={styles.card}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </Link>
        ))}
      </section>

      <section className={`${styles.split} ${styles.dashboardSplit}`}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Sản phẩm mới cập nhật</h2>
            <Link href="/admin/shop" className={styles.ghostButton}>Quản lý</Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Giá</th>
                <th>Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{formatVnd(product.price)}</td>
                  <td>{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Đơn hàng gần đây</h2>
            <Link href="/admin/shop/orders" className={styles.ghostButton}>Quản lý</Link>
          </div>
          <RecentOrdersTable initialOrders={overview.recentOrders} />
        </div>
      </section>

      <section className={`${styles.split} ${styles.dashboardSplit}`}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Âm thanh mới</h2>
            <Link href="/admin/sounds" className={styles.ghostButton}>Quản lý</Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentSounds.map((sound) => (
                <tr key={sound.id}>
                  <td>{sound.name}</td>
                  <td>{sound.category}</td>
                  <td>
                    <span className={`${styles.status} ${!sound.is_active ? styles.statusOff : ''}`}>
                      {sound.is_active ? 'Đang hiện' : 'Đã ẩn'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Bài cộng đồng mới</h2>
            <Link href="/admin/community" className={styles.ghostButton}>Kiểm duyệt</Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nội dung</th>
                <th>Người đăng</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentPosts.map((post) => (
                <tr key={post.id}>
                  <td className={styles.truncate}>{post.content}</td>
                  <td>
                    <strong>{post.author?.display_name || 'Ẩn danh'}</strong>
                  </td>
                  <td>{timeAgo(post.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
