'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MusicPlayer from './MusicPlayer';
import BadgeUnlockToast from '@/components/ui/BadgeUnlockToast';
import { useSoundStore } from '@/store/useSoundStore';
import styles from './Shell.module.css';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAiPage = pathname === '/ai';
  const activeSounds = useSoundStore((state) => state.activeSounds);
  const hasPlayer = activeSounds.length > 0;

  return (
    <div className={styles.container}>
      <TopNav onMenuClick={() => setMobileSidebarOpen(true)} />
      <div className={styles.mainWrapper}>
        <Sidebar
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <main className={`${styles.content} ${isAiPage ? styles.aiContent : ''} ${hasPlayer ? styles.hasPlayer : ''}`}>
          {children}
          {!isAiPage && <Footer />}
        </main>
      </div>
      <MusicPlayer />
      <BadgeUnlockToast />
    </div>
  );
}
