'use client';

import Shell from '@/components/layout/Shell';
import Link from 'next/link';
import { Play, Music, Gamepad2, Wind, Users, Bot, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <Shell>
      <div className={styles.container}>
        {/* Banner Section */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.greeting}>Chào mừng bạn đến với</p>
            <h2 className={`text-hero ${styles.brand}`}>TRẠM ÊM</h2>
            <p className={styles.heroSubtitle}>
              Nơi cảm xúc được lắng nghe, thấu hiểu<br />và chữa lành mỗi ngày 💜
            </p>
            <div className={styles.heroActions}>
              <button className={styles.btnPrimary}>Bắt đầu hành trình chữa lành</button>
              <button className={styles.btnSecondary}>Khám phá ngay</button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className={styles.featuresSectionWrapper}>
          <div className={styles.featuresSection}>
            <h3 className={styles.sectionTitle}>Hôm nay bạn muốn làm gì?</h3>
            <div className={styles.featuresGrid}>
              <Link href="/soundscape" className={styles.featureCard}>
                <div className={styles.featureIcon}><Music size={24} /></div>
                <h4>Nghe nhạc thư giãn</h4>
                <p>ASMR, nhạc chữa lành, âm thanh thiên nhiên</p>
              </Link>
              <Link href="/games" className={styles.featureCard}>
                <div className={styles.featureIcon}><Gamepad2 size={24} /></div>
                <h4>Chơi game giải trí</h4>
                <p>Những trò chơi nhỏ giúp bạn thư giãn</p>
              </Link>
              <Link href="/breathing" className={styles.featureCard}>
                <div className={styles.featureIcon}><Wind size={24} /></div>
                <h4>Kiểm soát nhịp thở</h4>
                <p>Điều hòa hơi thở, tìm lại sự bình yên</p>
              </Link>
              <Link href="/community" className={styles.featureCard}>
                <div className={styles.featureIcon}><Users size={24} /></div>
                <h4>Cộng đồng tích cực</h4>
                <p>Cùng chia sẻ, sắc màu yêu thương</p>
              </Link>
              <Link href="/ai" className={styles.featureCard}>
                <div className={styles.featureIcon}><Bot size={24} /></div>
                <h4>AI đồng hành</h4>
                <p>Trò chuyện cùng Omni, lắng nghe thấu hiểu</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Suggestions Section */}
        <div className={styles.suggestionsSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Gợi ý cho bạn hôm nay 💜</h3>
            <button className={styles.viewAllBtn}>Xem tất cả <ChevronRight size={16} /></button>
          </div>
          <div className={styles.suggestionsGrid}>
            {[
              { title: 'Như một làn gió mát', type: 'Âm thanh tĩnh', time: '40 phút', img: 'https://images.unsplash.com/photo-1445264718234-a623be589d37?w=500&auto=format&fit=crop&q=60' },
              { title: 'Sông nhỏ dịu êm', type: 'Âm thanh nước', time: '30 phút', img: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=500&auto=format&fit=crop&q=60' },
              { title: 'Rừng cây xanh ngát', type: 'Âm thanh thiên nhiên', time: '50 phút', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=60' },
              { title: 'Biển yên ả', type: 'Âm thanh sóng', time: '30 phút', img: 'https://images.unsplash.com/photo-1498623116890-37e912163d5d?w=500&auto=format&fit=crop&q=60' },
            ].map((item, index) => (
              <div key={index} className={styles.suggestionCard}>
                <div className={styles.thumbnailWrapper}>
                  <img src={item.img} alt={item.title} className={styles.thumbnail} />
                  <button className={styles.playBtn}><Play fill="currentColor" size={20} /></button>
                </div>
                <h4>{item.title}</h4>
                <p>{item.type} - {item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
