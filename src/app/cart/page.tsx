'use client';

import Shell from '@/components/layout/Shell';
import { formatVnd } from '@/utils/format';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './cart.module.css';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const openCheckout = useUIStore((state) => state.openCheckout);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Shell>
      <section className={styles.page}>
        <header className={styles.header}>
          <div>
            <span className={styles.kicker}>
              <ShoppingBag size={18} />
              Giỏ hàng
            </span>
            <h1>Những món nhỏ bạn đã chọn</h1>
            <p>Xem lại số lượng, bỏ bớt món chưa cần, rồi tiếp tục thanh toán khi đã sẵn sàng.</p>
          </div>
          {items.length > 0 && (
            <button type="button" className={styles.clearTopButton} onClick={clearCart}>
              Xóa tất cả
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingBag size={42} />
            <h2>Giỏ hàng đang trống</h2>
            <p>Chọn vài món thư giãn trong cửa hàng để bắt đầu.</p>
            <Link href="/shop">Đi tới cửa hàng</Link>
          </div>
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.items}>
              {items.map((item) => (
                <article key={item.id} className={styles.item}>
                  <Link href={`/shop/${item.slug}`} className={styles.itemImage}>
                    <Image src={item.image} alt={item.name} fill sizes="96px" className={styles.image} />
                  </Link>

                  <div className={styles.itemInfo}>
                    <Link href={`/shop/${item.slug}`} className={styles.itemName}>
                      {item.name}
                    </Link>
                    <span>{formatVnd(item.price)}</span>

                    <div className={styles.quantityControls}>
                      <button
                        type="button"
                        onClick={() =>
                          item.quantity <= 1
                            ? removeItem(item.id)
                            : updateQuantity(item.id, item.quantity - 1)
                        }
                        aria-label="Giảm số lượng"
                      >
                        <Minus size={15} />
                      </button>
                      <strong>{item.quantity}</strong>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Tăng số lượng"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.itemTotal}>
                    <strong>{formatVnd(item.price * item.quantity)}</strong>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Xóa ${item.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className={styles.summary}>
              <h2>Tóm tắt</h2>
              <div className={styles.summaryRow}>
                <span>Sản phẩm</span>
                <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Tạm tính</span>
                <strong>{formatVnd(total)}</strong>
              </div>
              <button type="button" onClick={openCheckout} className={styles.checkoutButton}>
                Thanh toán
              </button>
              <Link href="/shop" className={styles.continueLink}>
                Tiếp tục mua sắm
              </Link>
            </aside>
          </div>
        )}
      </section>
    </Shell>
  );
}
