import TopNav from './TopNav';
import Sidebar from './Sidebar';
import MusicPlayer from './MusicPlayer';
import styles from './Shell.module.css';

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <TopNav />
      <div className={styles.mainWrapper}>
        <Sidebar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
