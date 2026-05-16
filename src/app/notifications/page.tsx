import Shell from '@/components/layout/Shell';
import { Bell, CheckCircle2, Gift, HeartHandshake, Sparkles } from 'lucide-react';
import Link from 'next/link';
import styles from './notifications.module.css';

const notifications = [
  {
    icon: HeartHandshake,
    title: 'Gợi ý nghỉ ngơi nhẹ',
    body: 'Bạn có một bài thở 3 phút phù hợp cho cuối ngày hôm nay.',
    time: 'Vừa xong',
    href: '/breathing',
  },
  {
    icon: Sparkles,
    title: 'Playlist mới đã sẵn sàng',
    body: 'Bộ âm thanh mưa êm và gió nhẹ đã được thêm vào khu thư giãn.',
    time: '20 phút trước',
    href: '/soundscape',
  },
  {
    icon: Gift,
    title: 'Ưu đãi cửa hàng',
    body: 'Một vài món chăm sóc giấc ngủ đang có giá tốt trong tuần này.',
    time: 'Hôm nay',
    href: '/shop',
  },
];

export default function NotificationsPage() {
  return (
    <Shell>
      <section className={styles.page}>
        <header className={styles.header}>
          <span className={styles.kicker}>
            <Bell size={18} />
            Thông báo
          </span>
          <h1>Cập nhật dành cho bạn</h1>
          <p>Theo dõi gợi ý thư giãn, hoạt động cộng đồng và ưu đãi cửa hàng ở một nơi riêng.</p>
        </header>

        <div className={styles.list}>
          {notifications.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.title} href={item.href} className={styles.item}>
                <span className={styles.icon}>
                  <Icon size={22} />
                </span>
                <span className={styles.content}>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </span>
                <small>{item.time}</small>
              </Link>
            );
          })}
        </div>

        <div className={styles.readState}>
          <CheckCircle2 size={22} />
          <span>Bạn đã xem hết các thông báo hiện có.</span>
        </div>
      </section>
    </Shell>
  );
}
