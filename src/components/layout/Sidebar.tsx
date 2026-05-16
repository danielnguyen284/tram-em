'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Music, 
  Gamepad2, 
  Users, 
  Bot, 
  ShoppingBag,
  Wind
} from 'lucide-react';
import LogoMark from './LogoMark';
import styles from './Sidebar.module.css';

const navItems = [
  { icon: Home, label: 'Trang chủ', href: '/' },
  { icon: Music, label: 'Âm thanh', href: '/soundscape' },
  { icon: Wind, label: 'Nhịp thở', href: '/breathing' },
  { icon: Gamepad2, label: 'Mini game', href: '/games' },
  { icon: Users, label: 'Cộng đồng', href: '/community' },
  { icon: Bot, label: 'AI đồng hành', href: '/ai' },
  { icon: ShoppingBag, label: 'Cửa hàng', href: '/shop' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.promoWidget}>
        <LogoMark size={40} className={styles.promoLogo} />
        <h4>TRẠM ÊM</h4>
        <p>Nơi cảm xúc nương đậu</p>
        <button>Khám phá ngay</button>
      </div>
    </aside>
  );
}
