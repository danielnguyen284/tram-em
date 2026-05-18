'use client';

import { formatVnd } from '@/utils/format';
import { useCartStore } from '@/store/useCartStore';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './CartPopover.module.css';

export default function CartPopover({ onClose }: { onClose: () => void }) {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className={styles.popover}>
      <div className={styles.header}>
        <div>
          <p>Giỏ hàng</p>
          <strong>{items.length} sản phẩm</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng giỏ hàng">
          <X size={18} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <ShoppingBag size={34} />
          <strong>Giỏ hàng đang trống</strong>
          <span>Chọn vài món nhỏ trong cửa hàng để bắt đầu.</span>
          <Link href="/shop" onClick={onClose}>
            Đi tới cửa hàng
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.items}>
            {items.map((item) => (
              <article key={item.id} className={styles.item}>
                <Link href={`/shop/${item.slug}`} className={styles.itemImage} onClick={onClose}>
                  <Image src={item.image} alt={item.name} fill sizes="64px" className={styles.image} />
                </Link>

                <div className={styles.itemInfo}>
                  <Link href={`/shop/${item.slug}`} onClick={onClose}>
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
                      <Minus size={14} />
                    </button>
                    <strong>{item.quantity}</strong>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Tăng số lượng"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeItem(item.id)}
                  aria-label={`Xóa ${item.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>

          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Tổng tạm tính</span>
              <strong>{formatVnd(total)}</strong>
            </div>
            <Link href="/checkout" className={styles.checkoutButton} onClick={onClose}>
              Thanh toán
            </Link>
            <button type="button" className={styles.clearButton} onClick={clearCart}>
              Xóa giỏ hàng
            </button>
          </div>
        </>
      )}
    </div>
  );
}
