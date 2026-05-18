'use client';

import type { Sound as DbSound } from '@/types/database';
import { useSoundStore } from '@/store/useSoundStore';
import { Pause, Play } from 'lucide-react';
import { useState } from 'react';
import styles from './soundscape.module.css';

type Props = {
  sounds: DbSound[];
  categories: string[];
};

export default function SoundscapeClient({ sounds, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? 'Tất cả');
  const { addSound, activeSounds, removeSound } = useSoundStore();

  const visibleSounds = activeCategory === 'Tất cả'
    ? sounds
    : sounds.filter((sound) => sound.category === activeCategory);

  const handleToggleSound = (sound: DbSound) => {
    const isActive = activeSounds.some((s) => s.id === sound.id);
    if (isActive) {
      removeSound(sound.id);
      return;
    }

    addSound({
      id: sound.id,
      name: sound.name,
      url: sound.audio_url,
      icon: sound.icon ?? 'music',
      category: sound.category,
      duration: sound.duration ?? undefined,
      image: sound.image_url ?? undefined,
    });
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Âm thanh thư giãn</h1>
        <p>Lắng nghe để tâm hồn được nghỉ ngơi</p>
      </header>

      <div className={styles.filters} aria-label="Lọc âm thanh">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`${styles.filterButton} ${activeCategory === category ? styles.activeFilter : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {visibleSounds.map((sound) => {
          const isActive = activeSounds.some((s) => s.id === sound.id);

          return (
            <article key={sound.id} className={styles.soundCard}>
              <button
                type="button"
                className={styles.thumbnailButton}
                onClick={() => handleToggleSound(sound)}
                aria-label={`${isActive ? 'Tạm dừng' : 'Phát'} ${sound.name}`}
              >
                {sound.image_url && (
                  <img src={sound.image_url} alt="" className={styles.thumbnail} />
                )}
                <span className={styles.playButton}>
                  {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </span>
              </button>
              <div className={styles.cardBody}>
                <h2>{sound.mood ?? sound.name}</h2>
                <p>{sound.duration}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
