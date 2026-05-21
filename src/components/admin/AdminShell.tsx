'use client';

import type { Profile } from '@/types/database';
import {
  Bell,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Music,
  Shield,
  ShoppingBag,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useState } from 'react';
import { signOut } from '@/app/login/actions';
import styles from './AdminShell.module.css';

const navItems = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/sounds', label: 'Âm thanh', icon: Music },
  { 
    href: '/admin/shop/products', 
    label: 'Cửa hàng', 
    icon: ShoppingBag,
    submenu: [
      { href: '/admin/shop/categories', label: 'Quản lý danh mục' },
      { href: '/admin/shop/products', label: 'Quản lý sản phẩm' },
      { href: '/admin/shop/orders', label: 'Quản lý đơn hàng' },
    ]
  },
  { href: '/admin/community', label: 'Cộng đồng', icon: MessageCircle },
  { href: '/admin/notifications', label: 'Thông báo', icon: Bell },
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
  const [isShopExpanded, setIsShopExpanded] = useState(() => pathname.startsWith('/admin/shop'));

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
            const isShopActive = pathname.startsWith('/admin/shop');
            const isActive = item.submenu ? isShopActive : pathname === item.href;

            const handleParentClick = (e: React.MouseEvent) => {
              e.preventDefault();
              setIsShopExpanded(!isShopExpanded);
            };

            return (
              <Fragment key={item.href}>
                <Link 
                  href={item.href} 
                  onClick={item.submenu ? handleParentClick : undefined}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </span>
                  {item.submenu && (
                    isShopExpanded ? <ChevronDown size={16} color="#8a7a94" /> : <ChevronRight size={16} color="#8a7a94" />
                  )}
                </Link>

                {item.submenu && isShopExpanded && (
                  <div className={styles.submenu}>
                    {item.submenu.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link 
                          key={sub.href} 
                          href={sub.href} 
                          className={`${styles.subNavItem} ${isSubActive ? styles.subActive : ''}`}
                          style={{ paddingLeft: '38px' }}
                        >
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Fragment>
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
