import Shell from '@/components/layout/Shell';
import { buildSepayQrUrl } from '@/lib/sepay';
import { createClient } from '@/utils/supabase/server';
import { formatVnd } from '@/utils/format';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import PaymentStatusClient from './PaymentStatusClient';
import styles from './payment.module.css';

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent('Vui lòng đăng nhập để xem đơn hàng')}`);
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!order) {
    redirect('/cart');
  }

  const paymentCode = order.payment_code ?? '';
  const qrUrl = paymentCode
    ? buildSepayQrUrl({ amount: order.total, description: paymentCode })
    : null;

  return (
    <Shell>
      <section className={styles.page}>
        <header className={styles.header}>
          <div>
            <span className={styles.kicker}>SePay</span>
            <h1>Quét mã để thanh toán</h1>
            <p>Chuyển khoản đúng nội dung để hệ thống tự ghi nhận đơn hàng.</p>
          </div>
          <PaymentStatusClient
            orderId={order.id}
            initialStatus={order.payment_status}
            paidHref="/shop"
          />
        </header>

        <div className={styles.grid}>
          <div className={styles.qrPanel}>
            {qrUrl ? (
              <Image
                src={qrUrl}
                alt={`QR thanh toán ${paymentCode}`}
                width={360}
                height={360}
                className={styles.qrImage}
                priority
              />
            ) : (
              <div className={styles.qrFallback}>
                <strong>Chưa cấu hình tài khoản nhận tiền</strong>
                <span>Bổ sung `SEPAY_BANK_CODE` và `SEPAY_ACCOUNT_NUMBER` trong env để hiện QR.</span>
              </div>
            )}
          </div>

          <aside className={styles.detailPanel}>
            <h2>Thông tin chuyển khoản</h2>
            <div className={styles.detailRow}>
              <span>Số tiền</span>
              <strong>{formatVnd(order.total)}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Nội dung</span>
              <strong>{paymentCode}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Trạng thái</span>
              <strong>{order.payment_status}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Người nhận</span>
              <strong>{process.env.SEPAY_ACCOUNT_NAME || 'Cấu hình sau'}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Số tài khoản</span>
              <strong>{process.env.SEPAY_ACCOUNT_NUMBER || 'Cấu hình sau'}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Ngân hàng</span>
              <strong>{process.env.SEPAY_BANK_CODE || 'Cấu hình sau'}</strong>
            </div>
          </aside>
        </div>
      </section>
    </Shell>
  );
}
