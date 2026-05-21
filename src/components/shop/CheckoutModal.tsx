'use client';

import { createCheckoutOrder } from '@/app/checkout/actions';
import { useCartStore } from '@/store/useCartStore';
import { formatVnd } from '@/utils/format';
import { CheckCircle, MapPin, X, Loader } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CheckoutModal.module.css';

type SavedAddress = {
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
} | null;

type Props = {
  onClose: () => void;
};

export default function CheckoutModal({ onClose }: Props) {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const payload = useMemo(
    () => JSON.stringify(items.map((item) => ({ id: item.id, quantity: item.quantity }))),
    [items],
  );

  const [savedAddress, setSavedAddress] = useState<SavedAddress>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fetch saved address once on open
  useEffect(() => {
    fetch('/api/profile/address')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.shipping_name) setSavedAddress(data as SavedAddress);
      })
      .catch(() => {})
      .finally(() => setIsLoadingAddress(false));
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Submit handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const res = await createCheckoutOrder(formData);
        if (res && 'error' in res) {
          setErrorMsg(res.error);
        } else if (res?.success) {
          clearCart();
          setIsSuccess(true);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Có lỗi xảy ra');
      }
    });
  };

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Đặt hàng">
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <MapPin size={16} />
            <span>Thông tin giao hàng</span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CheckCircle size={64} color="#4ade80" />
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#2f2638' }}>Đã đặt hàng thành công!</h2>
            <p style={{ fontSize: '15px', color: '#5f5069', lineHeight: 1.5, maxWidth: '320px', margin: '0 auto' }}>
              Cảm ơn bạn đã đặt hàng. Admin sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận.
            </p>
            <button 
              type="button" 
              className={styles.submitBtn} 
              style={{ marginTop: '24px', width: '180px', padding: '0 24px' }} 
              onClick={() => {
                onClose();
                router.push('/');
                router.refresh();
              }}
            >
              Về trang chủ
            </button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div style={{ background: '#3b0000', color: '#ffaaaa', padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid #ff444433' }}>
                {errorMsg}
              </div>
            )}

        <form key={isLoadingAddress ? 'loading' : 'loaded'} onSubmit={handleSubmit} className={styles.body}>
          <input type="hidden" name="items" value={payload} />

          <div className={styles.formSection}>
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
                rows={3}
                autoComplete="street-address"
              />
            </label>
            <label>
              Ghi chú
              <textarea name="note" rows={2} placeholder="Thời gian nhận hàng, lời nhắn thêm..." />
            </label>
            <label>
              Facebook / Zalo (Không bắt buộc)
              <input
                name="contact_facebook"
                type="text"
                placeholder="Link Facebook hoặc số Zalo..."
                autoComplete="off"
              />
            </label>
            <label className={styles.checkboxLabel}>
              <input name="save_address" type="checkbox" defaultChecked={Boolean(savedAddress)} />
              Lưu địa chỉ này cho lần sau
            </label>
          </div>

          <div className={styles.summary}>
            <p className={styles.summaryTitle}>Đơn hàng</p>
            <div className={styles.summaryItems}>
              {items.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.itemImg}>
                    <Image src={item.image} alt={item.name} fill sizes="40px" />
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.quantity} × {formatVnd(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.totalRow}>
              <span>Tổng</span>
              <strong>{formatVnd(total)}</strong>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? <Loader className="animate-spin" size={18} /> : 'Đặt hàng'}
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
