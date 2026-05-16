'use client';

import { Bell, ShoppingCart, User, Moon, Sun, LogOut } from 'lucide-react';
import styles from './TopNav.module.css';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { signOut } from '@/app/login/actions';
import Link from 'next/link';
import LogoMark from './LogoMark';
import CartPopover from '@/components/shop/CartPopover';
import { useCartStore } from '@/store/useCartStore';

export default function TopNav() {
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
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      const theme = localStorage.getItem('theme');
      const isDarkMode = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
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
      <Link href="/" className={styles.brand} aria-label="Trạm Êm">
        <LogoMark size={48} />
        <span className={styles.brandText}>Trạm Êm</span>
      </Link>

      <div className={styles.actions}>
        <button onClick={toggleTheme} className={styles.iconBtn} aria-label="Toggle theme">
          {mounted ? (isDark ? <Sun size={20} /> : <Moon size={20} />) : <Moon size={20} />}
        </button>
        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>
        <div className={styles.cartWrapper} ref={cartRef}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Shopping cart"
            aria-expanded={cartOpen}
            onClick={() => setCartOpen((open) => !open)}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
          {cartOpen && <CartPopover onClose={() => setCartOpen(false)} />}
        </div>
        
        {user ? (
          <div className={styles.profileWrapper}>
            <div className={styles.profile}>
              <User size={20} />
              <span className={styles.userName}>{user.email?.split('@')[0]}</span>
            </div>
            <button onClick={() => signOut()} className={styles.logoutBtn} title="Đăng xuất">
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
