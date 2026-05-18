'use client';

import { useCartStore } from '@/store/useCartStore';
import { CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './payment.module.css';

type PaymentStatusClientProps = {
  orderId: string;
  initialStatus: string;
  paidHref: string;
};

export default function PaymentStatusClient({
  orderId,
  initialStatus,
  paidHref,
}: PaymentStatusClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (status === 'paid') {
      clearCart();
      return;
    }

    const intervalId = window.setInterval(async () => {
      const response = await fetch(`/api/orders/${orderId}/payment-status`, {
        cache: 'no-store',
      });

      if (!response.ok) return;

      const data = (await response.json()) as { payment_status?: string };
      if (data.payment_status) {
        setStatus(data.payment_status);
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [clearCart, orderId, status]);

  if (status === 'paid') {
    return (
      <div className={styles.statusPaid}>
        <CheckCircle2 size={18} />
        <span>Đã thanh toán</span>
        <Link href={paidHref}>Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div className={styles.statusPending}>
      <Clock size={18} />
      <span>Đang chờ thanh toán</span>
    </div>
  );
}
