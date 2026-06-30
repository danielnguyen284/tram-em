'use client';

import type { Sound } from '@/types/database';
import Link from 'next/link';
import { Play, Pause, Music, Gamepad2, Wind, Users, Bot, ChevronRight } from 'lucide-react';
import { useSoundStore } from '@/store/useSoundStore';
import { toPlayableSound } from '@/lib/sounds/playback';
import { useEffect, useMemo } from 'react';
import styles from './page.module.css';

type Props = {
  featuredSounds: Sound[];
};

export default function HomeClient({ featuredSounds }: Props) {
  const { addSound, activeSounds, removeSound, setPlaylist } = useSoundStore();

  const playlist = useMemo(() => featuredSounds.map(toPlayableSound), [featuredSounds]);

  useEffect(() => {
    setPlaylist(playlist);
  }, [playlist, setPlaylist]);

  const handleToggleSound = (sound: Sound) => {
    const isActive = activeSounds.some((s) => s.id === sound.id && s.isPlaying);
    if (isActive) {
      removeSound(sound.id);
      return;
    }

    addSound(toPlayableSound(sound));
  };

  return (
    <div className={styles.container}>
      {/* Banner Section */}
      <section className={styles.hero} aria-labelledby="home-hero-title">
        <div className={styles.heroContent}>
          <p className={styles.greeting}>Chào mừng bạn đến với</p>
          <h2 id="home-hero-title" className={`text-hero ${styles.brand}`}>TRẠM ÊM</h2>
          <p className={styles.heroSubtitle}>
            Nơi cảm xúc được lắng nghe, thấu hiểu<br />và chữa lành mỗi ngày 💜
          </p>
        </div>
      </section>

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
          <Link href="/soundscape" className={styles.viewAllBtn}>Xem tất cả <ChevronRight size={16} /></Link>
        </div>
        <div className={styles.suggestionsGrid}>
          {featuredSounds.map((sound) => {
            const isActive = activeSounds.some((s) => s.id === sound.id && s.isPlaying);

            return (
              <div key={sound.id} className={styles.suggestionCard}>
                <button
                  type="button"
                  className={styles.thumbnailWrapper}
                  onClick={() => handleToggleSound(sound)}
                  aria-label={`${isActive ? 'Tạm dừng' : 'Phát'} ${sound.name}`}
                >
                  {sound.image_url && (
                    <img src={sound.image_url} alt={sound.name} className={styles.thumbnail} />
                  )}
                  <span
                    className={styles.playBtn}
                    aria-label={`${isActive ? 'Tạm dừng' : 'Phát'} ${sound.name}`}
                  >
                    {isActive ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} />}
                  </span>
                </button>
                <h4>{sound.name}</h4>
                <p>{sound.category} - {sound.duration}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
