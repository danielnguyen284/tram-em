import Shell from '@/components/layout/Shell';
import { getOrders } from '@/lib/supabase/orders';
import { formatVnd } from '@/utils/format';
import { createClient } from '@/utils/supabase/server';
import { PackageCheck, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from './orders.module.css';

export const dynamic = 'force-dynamic';

const orderStatusNames: Record<string, string> = {
  pending: 'Đang xử lý',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const paymentStatusNames: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  expired: 'Hết hạn',
  failed: 'Thất bại',
  manual_review: 'Đang kiểm tra',
};

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const orders = await getOrders();

  return (
    <Shell>
      <section className={styles.page}>
        <header className={styles.header}>
          <span className={styles.kicker}>
            <ShoppingBag size={18} />
            Đơn hàng
          </span>
          <h1>Lịch sử mua hàng</h1>
          <p>Theo dõi các đơn đã đặt, trạng thái xử lý và thông tin thanh toán.</p>
        </header>

        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <PackageCheck size={42} />
            <h2>Chưa có đơn hàng</h2>
            <p>Các đơn bạn đặt tại Trạm Êm sẽ xuất hiện ở đây.</p>
            <Link href="/shop">Mua sắm ngay</Link>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => (
              <article key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <p className={styles.orderCode}>#{order.payment_code ?? order.id.slice(0, 8)}</p>
                    <span>{dateFormatter.format(new Date(order.created_at))}</span>
                  </div>
                  <div className={styles.statusGroup}>
                    <span className={styles.status}>{orderStatusNames[order.status] ?? order.status}</span>
                    <span className={`${styles.status} ${order.payment_status === 'paid' ? styles.paid : styles.pending}`}>
                      {paymentStatusNames[order.payment_status] ?? order.payment_status}
                    </span>
                  </div>
                </div>

                <div className={styles.items}>
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className={styles.item}>
                      <div>
                        <strong>{item.product_name}</strong>
                        <span>Số lượng: {item.quantity}</span>
                      </div>
                      <span>{formatVnd(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.orderFooter}>
                  <span>Giao đến: {order.shipping_name ?? 'Chưa cập nhật'}</span>
                  <strong>{formatVnd(order.total)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
