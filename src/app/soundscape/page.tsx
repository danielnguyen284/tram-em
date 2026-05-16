'use client';

import Shell from '@/components/layout/Shell';
import { Sound, useSoundStore } from '@/store/useSoundStore';
import { Pause, Play } from 'lucide-react';
import { useState } from 'react';
import styles from './soundscape.module.css';

type DemoSound = Omit<Sound, 'volume' | 'isPlaying'> & {
  mood: string;
};

const categories = ['Tất cả', 'Nhạc thiền', 'ASMR', 'Truyện audio', 'Năng lượng', 'Thư giãn'];

const demoSounds: DemoSound[] = [
  {
    id: 'rain-leaves',
    name: 'Mưa rơi trên lá',
    category: 'ASMR',
    mood: 'Như một làn gió cổ',
    duration: '40 phút',
    icon: 'rain',
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=700&auto=format&fit=crop&q=80',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_515949e29a.mp3?filename=rain-on-window-17482.mp3',
  },
  {
    id: 'green-forest',
    name: 'Rừng cây xanh mát',
    category: 'Nhạc thiền',
    mood: 'Rừng cây xanh mát',
    duration: 'Dịu ngọt',
    icon: 'forest',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&auto=format&fit=crop&q=80',
    url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_f5904d6023.mp3?filename=forest-birds-6738.mp3',
  },
  {
    id: 'warm-lake',
    name: 'Nâng niu đã ấm',
    category: 'Thư giãn',
    mood: 'Nâng niu đã ấm',
    duration: '6h0 ngọt',
    icon: 'lake',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&auto=format&fit=crop&q=80',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_3387799516.mp3?filename=ocean-waves-112937.mp3',
  },
  {
    id: 'river-energy',
    name: 'Năng chải theo dó gián',
    category: 'Năng lượng',
    mood: 'Năng chải theo dó gián',
    duration: 'Thư ngọt',
    icon: 'river',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=700&auto=format&fit=crop&q=80',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_2744888898.mp3?filename=frogs-and-crickets-7142.mp3',
  },
  {
    id: 'quiet-wind',
    name: 'Như một làn gió cổ',
    category: 'ASMR',
    mood: 'Như một làn gió cổ',
    duration: '70 ngọt',
    icon: 'wind',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=700&auto=format&fit=crop&q=80',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_32c9e76742.mp3?filename=meditation-bowl-16168.mp3',
  },
  {
    id: 'story-mountain',
    name: 'Rừng cây xanh mát',
    category: 'Truyện audio',
    mood: 'Rừng cây xanh mát',
    duration: '30 phút',
    icon: 'story',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=700&auto=format&fit=crop&q=80',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a1670f.mp3?filename=campfire-16167.mp3',
  },
  {
    id: 'night-lake',
    name: 'Bấm thanh thư giãn',
    category: 'Thư giãn',
    mood: 'Bấm thanh thư giãn',
    duration: '30 phút',
    icon: 'night',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&auto=format&fit=crop&q=80',
    url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_f5904d6023.mp3?filename=forest-birds-6738.mp3',
  },
  {
    id: 'campfire',
    name: 'Mưa rơi thì làn',
    category: 'Thư giãn',
    mood: 'Mưa rơi thì làn',
    duration: '70 phút',
    icon: 'fire',
    image: 'https://images.unsplash.com/photo-1477160739634-171ff0343882?w=700&auto=format&fit=crop&q=80',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a1670f.mp3?filename=campfire-16167.mp3',
  },
];

export default function SoundscapePage() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const { addSound, activeSounds, removeSound } = useSoundStore();

  const visibleSounds = activeCategory === 'Tất cả'
    ? demoSounds
    : demoSounds.filter((sound) => sound.category === activeCategory);

  const handleToggleSound = (sound: DemoSound) => {
    const isActive = activeSounds.some((activeSound) => activeSound.id === sound.id);
    if (isActive) {
      removeSound(sound.id);
      return;
    }

    addSound(sound);
  };

  return (
    <Shell>
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
            const isActive = activeSounds.some((activeSound) => activeSound.id === sound.id);

            return (
              <article key={sound.id} className={styles.soundCard}>
                <button
                  type="button"
                  className={styles.thumbnailButton}
                  onClick={() => handleToggleSound(sound)}
                  aria-label={`${isActive ? 'Tạm dừng' : 'Phát'} ${sound.name}`}
                >
                  <img src={sound.image} alt="" className={styles.thumbnail} />
                  <span className={styles.playButton}>
                    {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </span>
                </button>
                <div className={styles.cardBody}>
                  <h2>{sound.mood}</h2>
                  <p>{sound.duration}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
