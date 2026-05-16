'use client';

import { signOut } from '@/app/login/actions';
import CartPopover from '@/components/shop/CartPopover';
import { useCartStore } from '@/store/useCartStore';
import { createClient } from '@/utils/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Bell, LogOut, Menu, Moon, ShoppingCart, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import LogoMark from './LogoMark';
import styles from './TopNav.module.css';

type TopNavProps = {
  onMenuClick: () => void;
};

export default function TopNav({ onMenuClick }: TopNavProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      const theme = localStorage.getItem('theme');
      const isDarkMode =
        theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkMode);
    });
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }, [isDark, mounted]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!cartRef.current?.contains(event.target as Node)) {
        setCartOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <header className={styles.header}>
      <button
        type="button"
        onClick={onMenuClick}
        className={`${styles.iconBtn} ${styles.menuButton}`}
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>

      <Link href="/" className={styles.brand} aria-label="Trạm Êm">
        <LogoMark size={48} />
        <span className={styles.brandText}>Trạm Êm</span>
      </Link>

      <div className={styles.actions}>
        <button type="button" onClick={toggleTheme} className={styles.iconBtn} aria-label="Đổi giao diện">
          {mounted ? (isDark ? <Sun size={20} /> : <Moon size={20} />) : <Moon size={20} />}
        </button>

        <Link href="/notifications" className={styles.iconBtn} aria-label="Thông báo">
          <Bell size={20} />
          <span className={styles.badge}></span>
        </Link>

        <div className={`${styles.cartWrapper} ${styles.desktopCart}`} ref={cartRef}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Giỏ hàng"
            aria-expanded={cartOpen}
            onClick={() => setCartOpen((open) => !open)}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
          {cartOpen && <CartPopover onClose={() => setCartOpen(false)} />}
        </div>

        <Link href="/cart" className={`${styles.iconBtn} ${styles.mobileCart}`} aria-label="Giỏ hàng">
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
        </Link>

        {user ? (
          <div className={styles.profileWrapper}>
            <div className={styles.profile}>
              <User size={20} />
              <span className={styles.userName}>{user.email?.split('@')[0]}</span>
            </div>
            <button type="button" onClick={() => signOut()} className={styles.logoutBtn} title="Đăng xuất">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link href="/login" className={styles.loginLink}>
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
