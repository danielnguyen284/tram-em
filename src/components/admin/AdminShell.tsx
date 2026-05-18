'use client';

import type { Profile } from '@/types/database';
import {
  Bell,
  Gamepad2,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Music,
  Shield,
  ShoppingBag,
  Users,
  Wind,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/login/actions';
import styles from './AdminShell.module.css';

const navItems = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/sounds', label: 'Âm thanh', icon: Music },
  { href: '/admin/breathing', label: 'Nhịp thở', icon: Wind },
  { href: '/admin/games', label: 'Trò chơi', icon: Gamepad2 },
  { href: '/admin/shop', label: 'Cửa hàng', icon: ShoppingBag },
  { href: '/admin/community', label: 'Cộng đồng', icon: MessageCircle },
  { href: '/admin/notifications', label: 'Thông báo', icon: Bell },
  { href: '/admin/media', label: 'Thư viện', icon: ImageIcon },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
];

type Props = {
  children: React.ReactNode;
  profile: Profile | null;
  email?: string | null;
};

export default function AdminShell({ children, profile, email }: Props) {
  const pathname = usePathname();
  const name = profile?.display_name ?? email?.split('@')[0] ?? 'Admin';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          <span className={styles.brandMark}>
            <Shield size={22} />
          </span>
          <span>
            <strong>Trạm Êm CMS</strong>
            <small>Trang quản trị</small>
          </span>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.homeLink}>
            <Home size={17} />
            Về trang chủ
          </Link>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p>Đang quản trị với quyền admin</p>
            <strong>{name}</strong>
          </div>
          <button type="button" onClick={() => signOut()} className={styles.logoutButton}>
            <LogOut size={17} />
            Đăng xuất
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}
