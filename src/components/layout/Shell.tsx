'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import MusicPlayer from './MusicPlayer';
import BadgeUnlockToast from '@/components/ui/BadgeUnlockToast';
import styles from './Shell.module.css';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAiPage = pathname === '/ai';

  return (
    <div className={styles.container}>
      <TopNav onMenuClick={() => setMobileSidebarOpen(true)} />
      <div className={styles.mainWrapper}>
        <Sidebar
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <main className={`${styles.content} ${isAiPage ? styles.aiContent : ''}`}>
          {children}
        </main>
      </div>
      <MusicPlayer />
      <BadgeUnlockToast />
    </div>
  );
}
