'use client';

import { signOut } from '@/app/login/actions';
import CartPopover from '@/components/shop/CartPopover';
import { useCartStore } from '@/store/useCartStore';
import { createClient } from '@/utils/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Sun,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import LogoMark from './LogoMark';
import styles from './TopNav.module.css';

type TopNavProps = {
  onMenuClick: () => void;
};

type ProfileState = {
  display_name: string | null;
  avatar_url: string | null;
};

type Gender = 'male' | 'female';

const DEFAULT_AVATARS: Record<Gender, string> = {
  male: '/images/avatar-default-male.png',
  female: '/images/avatar-default-female.png',
};

export default function TopNav({ onMenuClick }: TopNavProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
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

      if (!user) {
        setProfile(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      setProfile((profile as ProfileState | null) ?? null);
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

      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCartOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const gender = user?.user_metadata?.gender === 'female' ? 'female' : 'male';
  const displayName =
    profile?.display_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Bạn';
  const avatarSrc = profile?.avatar_url ?? DEFAULT_AVATARS[gender];

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
          <div className={styles.profileWrapper} ref={profileRef}>
            <button
              type="button"
              className={styles.profile}
              aria-label="Mở menu tài khoản"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className={styles.avatarFrame}>
                <Image src={avatarSrc} alt="" fill sizes="28px" className={styles.avatarImg} />
              </span>
              <span className={styles.userName}>{displayName}</span>
              <ChevronDown size={16} className={styles.profileChevron} />
            </button>

            {profileOpen && (
              <div className={styles.profileMenu}>
                <div className={styles.profileCard}>
                  <span className={styles.menuAvatar}>
                    <Image src={avatarSrc} alt="" fill sizes="46px" className={styles.avatarImg} />
                  </span>
                  <div className={styles.profileMeta}>
                    <strong>{displayName}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>

                <Link href="/profile" className={styles.menuItem} onClick={() => setProfileOpen(false)}>
                  <User size={17} />
                  <span>Hồ sơ cá nhân</span>
                </Link>
                <Link href="/account/security" className={styles.menuItem} onClick={() => setProfileOpen(false)}>
                  <ShieldCheck size={17} />
                  <span>Tài khoản & bảo mật</span>
                </Link>
                <Link href="/account/orders" className={styles.menuItem} onClick={() => setProfileOpen(false)}>
                  <ReceiptText size={17} />
                  <span>Đơn hàng</span>
                </Link>
                <button type="button" onClick={() => signOut()} className={`${styles.menuItem} ${styles.logoutBtn}`}>
                  <LogOut size={17} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
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
