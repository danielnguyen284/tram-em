'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { BADGE_UNLOCKED_EVENT, type NewBadge } from '@/hooks/useLogActivity';
import styles from './BadgeUnlockToast.module.css';

type ToastItem = NewBadge & { key: number; phase: 'enter' | 'exit' };

const DISPLAY_DURATION = 4500; // ms each toast stays visible
const EXIT_DURATION = 500;     // ms for exit animation

let toastKey = 0;

export default function BadgeUnlockToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const queueRef = useRef<NewBadge[]>([]);
  const processingRef = useRef(false);

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }

    processingRef.current = true;
    const badge = queueRef.current.shift()!;
    const key = toastKey++;

    // Add with enter phase
    setToasts((prev) => [...prev, { ...badge, key, phase: 'enter' }]);

    // After display duration, start exit animation
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.key === key ? { ...t, phase: 'exit' } : t))
      );
      // After exit animation finishes, remove and show next
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.key !== key));
        showNext();
      }, EXIT_DURATION);
    }, DISPLAY_DURATION);
  }, []);

  // Check for any unnotified badges on route change or custom event
  const pathname = usePathname();
  
  useEffect(() => {
    let mounted = true;
    const checkBadges = async () => {
      try {
        const res = await fetch('/api/badges/check');
        const data = await res.json();
        if (mounted && data.ok && data.newBadges && data.newBadges.length > 0) {
          queueRef.current.push(...data.newBadges);
          if (!processingRef.current) {
            showNext();
          }
        }
      } catch (err) {
        // silently ignore
      }
    };

    // Check on mount and pathname change
    checkBadges();

    // Allow manual trigger from anywhere
    const handleCheckRequest = () => checkBadges();
    window.addEventListener('tramem:check-badges', handleCheckRequest);

    const handler = (e: Event) => {
      const badges = (e as CustomEvent<NewBadge[]>).detail;
      queueRef.current.push(...badges);
      if (!processingRef.current) {
        showNext();
      }
    };

    window.addEventListener(BADGE_UNLOCKED_EVENT, handler);
    return () => {
      mounted = false;
      window.removeEventListener(BADGE_UNLOCKED_EVENT, handler);
      window.removeEventListener('tramem:check-badges', handleCheckRequest);
    };
  }, [showNext, pathname]);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.key}
          className={`${styles.toast} ${toast.phase === 'exit' ? styles.toastExit : styles.toastEnter}`}
          role="status"
        >
          {/* Glow ring */}
          <div className={styles.glowRing} aria-hidden="true" />

          {/* Badge image */}
          <div className={styles.imageWrapper} aria-hidden="true">
            <Image src={toast.image} alt={toast.name} width={56} height={56} className={styles.badgeImage} />
            <div className={styles.sparkles} aria-hidden="true">
              {['✦', '✦', '✦', '✦', '✦', '✦'].map((s, i) => (
                <span key={i} className={styles.sparkle}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Text */}
          <div className={styles.textBlock}>
            <p className={styles.unlockLabel}>🎉 Chúc mừng bạn đã mở khóa huy hiệu mới!</p>
            <p className={styles.badgeName}>{toast.name}</p>
            <p className={styles.badgeDescription}>{toast.description}</p>
          </div>

          {/* Shimmer strip */}
          <div className={styles.shimmer} aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
