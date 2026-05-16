'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Gamepad2,
  Home,
  Music,
  ShoppingBag,
  Users,
  Wind,
  X,
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

type SidebarProps = {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        className={`${styles.backdrop} ${isMobileOpen ? styles.backdropOpen : ''}`}
        onClick={onMobileClose}
        aria-label="Đóng menu"
      />
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.mobileHeader}>
          <LogoMark size={40} />
          <span>TRẠM ÊM</span>
          <button type="button" onClick={onMobileClose} aria-label="Đóng menu">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={onMobileClose}
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
    </>
  );
}
