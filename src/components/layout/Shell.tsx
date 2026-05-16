'use client';

import { useState } from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import MusicPlayer from './MusicPlayer';
import styles from './Shell.module.css';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className={styles.container}>
      <TopNav onMenuClick={() => setMobileSidebarOpen(true)} />
      <div className={styles.mainWrapper}>
        <Sidebar
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
