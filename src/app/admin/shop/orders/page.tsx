import { getAdminOrders } from '@/lib/admin/data';
import styles from '../../admin.module.css';
import { OrdersTable } from '../OrdersTable';

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Quản lý đơn hàng</h1>
          <p>Quản lý trạng thái, thông tin liên hệ và chi tiết của đơn hàng.</p>
        </div>
      </header>

      <OrdersTable initialOrders={orders} />
    </div>
  );
}
