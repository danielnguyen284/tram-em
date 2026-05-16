'use client';

import { Bell, ShoppingCart, User, Moon, Sun, LogOut, Search } from 'lucide-react';
import styles from './TopNav.module.css';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { signOut } from '@/app/login/actions';
import Link from 'next/link';
import LogoMark from './LogoMark';

export default function TopNav() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    setMounted(true);
    const theme = localStorage.getItem('theme');
    const isDarkMode = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }, [isDark, mounted]);

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
        {/* <button className={styles.iconBtn} aria-label="Search">
          <Search size={20} />
        </button> */}
        <button onClick={toggleTheme} className={styles.iconBtn} aria-label="Toggle theme">
          {mounted ? (isDark ? <Sun size={20} /> : <Moon size={20} />) : <Moon size={20} />}
        </button>
        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>
        <button className={styles.iconBtn} aria-label="Shopping cart">
          <ShoppingCart size={20} />
        </button>
        
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
