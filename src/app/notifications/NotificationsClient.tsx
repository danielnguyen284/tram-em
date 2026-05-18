'use client';

import type { Notification } from '@/types/database';
import { timeAgo } from '@/utils/format';
import { Bell, CheckCircle2, HeartHandshake, Sparkles, Gift, ShoppingBag, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import styles from './notifications.module.css';

const ICON_MAP: Record<string, React.ComponentType<{ size: number }>> = {
  heart: HeartHandshake,
  sparkles: Sparkles,
  gift: Gift,
  bell: Bell,
  shop: ShoppingBag,
  message: MessageCircle,
};

type Props = {
  notifications: Notification[];
  isAuthenticated: boolean;
};

export default function NotificationsClient({ notifications, isAuthenticated }: Props) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.kicker}>
          <Bell size={18} />
          Thông báo
        </span>
        <h1>Cập nhật dành cho bạn</h1>
        <p>Theo dõi gợi ý thư giãn, hoạt động cộng đồng và ưu đãi cửa hàng ở một nơi riêng.</p>
      </header>

      {!isAuthenticated ? (
        <div className={styles.readState}>
          <Bell size={22} />
          <span>Đăng nhập để nhận thông báo cá nhân.</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.readState}>
          <CheckCircle2 size={22} />
          <span>Bạn đã xem hết các thông báo hiện có.</span>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {notifications.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? Bell;

              return (
                <Link
                  key={item.id}
                  href={item.href ?? '#'}
                  className={styles.item}
                >
                  <span className={styles.icon}>
                    <Icon size={22} />
                  </span>
                  <span className={styles.content}>
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </span>
                  <small>{timeAgo(item.created_at)}</small>
                </Link>
              );
            })}
          </div>

          <div className={styles.readState}>
            <CheckCircle2 size={22} />
            <span>Bạn đã xem hết các thông báo hiện có.</span>
          </div>
        </>
      )}
    </section>
  );
}
