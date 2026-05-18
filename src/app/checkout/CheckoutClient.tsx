'use client';

import { createCheckoutOrder } from '@/app/checkout/actions';
import { useCartStore } from '@/store/useCartStore';
import type { ShippingAddress } from '@/types/database';
import { formatVnd } from '@/utils/format';
import { MailCheck, MapPin, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import styles from './checkout.module.css';

type CheckoutClientProps = {
  message?: string;
  email: string;
  emailConfirmed: boolean;
  savedAddress: ShippingAddress | null;
};

export default function CheckoutClient({
  message,
  email,
  emailConfirmed,
  savedAddress,
}: CheckoutClientProps) {
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const payload = useMemo(
    () => JSON.stringify(items.map((item) => ({ id: item.id, quantity: item.quantity }))),
    [items],
  );

  if (!emailConfirmed) {
    return (
      <section className={styles.page}>
        <div className={styles.noticePanel}>
          <MailCheck size={34} />
          <h1>Xác minh email trước khi thanh toán</h1>
          <p>
            Tài khoản {email} cần xác minh email để tiếp tục đặt hàng. Hãy mở email từ Supabase/Trạm Êm
            và bấm liên kết xác nhận, sau đó quay lại trang này.
          </p>
          <Link href="/cart">Quay lại giỏ hàng</Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>
            <MapPin size={18} />
            Thanh toán
          </span>
          <h1>Thông tin giao hàng</h1>
          <p>Nhập địa chỉ nhận hàng, sau đó quét mã chuyển khoản SePay để hoàn tất đơn.</p>
        </div>
      </header>

      {message && <p className={styles.message}>{message}</p>}

      {items.length === 0 ? (
        <div className={styles.noticePanel}>
          <ShoppingBag size={38} />
          <h2>Giỏ hàng đang trống</h2>
          <p>Chọn sản phẩm trước khi tạo đơn thanh toán.</p>
          <Link href="/shop">Đi tới cửa hàng</Link>
        </div>
      ) : (
        <form action={createCheckoutOrder} className={styles.checkoutGrid}>
          <input type="hidden" name="items" value={payload} />

          <div className={styles.formPanel}>
            <label>
              Họ tên người nhận
              <input
                name="shipping_name"
                required
                defaultValue={savedAddress?.shipping_name ?? ''}
                autoComplete="name"
              />
            </label>
            <label>
              Số điện thoại
              <input
                name="shipping_phone"
                required
                defaultValue={savedAddress?.shipping_phone ?? ''}
                autoComplete="tel"
              />
            </label>
            <label>
              Địa chỉ giao hàng
              <textarea
                name="shipping_address"
                required
                defaultValue={savedAddress?.shipping_address ?? ''}
                rows={4}
                autoComplete="street-address"
              />
            </label>
            <label>
              Ghi chú
              <textarea name="note" rows={3} placeholder="Thời gian nhận hàng, lời nhắn thêm..." />
            </label>
            <label className={styles.checkbox}>
              <input name="save_address" type="checkbox" defaultChecked={Boolean(savedAddress)} />
              Lưu địa chỉ này cho lần sau
            </label>
          </div>

          <aside className={styles.summary}>
            <h2>Đơn hàng</h2>
            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    <Image src={item.image} alt={item.name} fill sizes="54px" />
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.quantity} x {formatVnd(item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.summaryRow}>
              <span>Sản phẩm</span>
              <strong>{itemCount}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Tổng thanh toán</span>
              <strong>{formatVnd(total)}</strong>
            </div>
            <button type="submit" className={styles.submitButton}>
              Tạo mã thanh toán
            </button>
          </aside>
        </form>
      )}
    </section>
  );
}
