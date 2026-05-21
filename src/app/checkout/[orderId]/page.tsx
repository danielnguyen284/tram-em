import Shell from '@/components/layout/Shell';
import { saveOrderContact } from '@/app/checkout/actions';
import { createClient } from '@/utils/supabase/server';
import { formatVnd } from '@/utils/format';
import { redirect } from 'next/navigation';
import styles from './contact.module.css';
import { CheckCircle, Phone, MessageSquare, Mail, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default async function OrderContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ message?: string; submitted?: string }>;
}) {
  const { orderId } = await params;
  const { message, submitted } = await searchParams;

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .maybeSingle();

  // Nếu đã submit thành công → trang xác nhận
  const isSubmitted = submitted === '1' || Boolean(order.contact_phone || order.contact_facebook);

  if (isSubmitted) {
    return (
      <Shell>
        <section className={styles.page}>
          <div className={styles.successBox}>
            <CheckCircle size={52} className={styles.successIcon} />
            <h1>Đơn hàng đã được ghi nhận!</h1>
            <p>
              Cảm ơn bạn đã đặt hàng tại Trạm Êm 💜<br />
              Mình sẽ liên hệ xác nhận đơn trong vòng <strong>24 giờ</strong> — hãy để ý điện thoại nhé!
            </p>
            <div className={styles.orderSummary}>
              <div className={styles.orderRow}>
                <span>Mã đơn</span>
                <strong>#{orderId.slice(0, 8).toUpperCase()}</strong>
              </div>
              <div className={styles.orderRow}>
                <span>Tổng tiền</span>
                <strong>{formatVnd(order.total)}</strong>
              </div>
              <div className={styles.orderRow}>
                <span>Trạng thái</span>
                <span className={styles.statusBadge}>Đang xử lý</span>
              </div>
            </div>
            <div className={styles.successActions}>
              <Link href="/shop" className={styles.primaryBtn}>
                <ShoppingBag size={17} />
                Tiếp tục mua sắm
              </Link>
              <Link href="/account/orders" className={styles.ghostBtn}>
                Xem lịch sử đơn hàng
              </Link>
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className={styles.page}>
        <header className={styles.header}>
          <CheckCircle size={34} className={styles.headerIcon} />
          <div>
            <span className={styles.kicker}>Đặt hàng thành công!</span>
            <h1>Để lại thông tin liên hệ</h1>
            <p>
              Đơn <strong>#{orderId.slice(0, 8).toUpperCase()}</strong> — {formatVnd(order.total)}<br />
              Mình cần thông tin để liên hệ xác nhận và giao hàng cho bạn.
            </p>
          </div>
        </header>

        {message && <p className={styles.errorMessage}>{message}</p>}

        <form action={saveOrderContact} className={styles.form}>
          <input type="hidden" name="order_id" value={orderId} />

          <div className={styles.field}>
            <label htmlFor="contact_phone">
              <Phone size={16} />
              Số điện thoại
              <span className={styles.required}>*</span>
            </label>
            <input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              placeholder="0912 345 678"
              defaultValue={profile?.phone ?? ''}
              autoComplete="tel"
            />
            <small>Bắt buộc nếu không có Facebook</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="contact_facebook">
              <MessageSquare size={16} />
              Facebook / Zalo
            </label>
            <input
              id="contact_facebook"
              name="contact_facebook"
              type="text"
              placeholder="facebook.com/username hoặc số Zalo"
              autoComplete="off"
            />
            <small>Bắt buộc nếu không có số điện thoại</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="contact_email">
              <Mail size={16} />
              Email
            </label>
            <input
              id="contact_email"
              type="email"
              value={user.email ?? ''}
              disabled
              className={styles.disabledInput}
            />
            <small>Lấy từ tài khoản — không thể thay đổi</small>
          </div>

          <p className={styles.hint}>
            ⚠️ Cần ít nhất <strong>số điện thoại</strong> hoặc <strong>Facebook/Zalo</strong> để Admin có thể liên hệ bạn.
          </p>

          <button type="submit" className={styles.submitBtn}>
            Xác nhận thông tin liên hệ
          </button>
        </form>
      </section>
    </Shell>
  );
}
