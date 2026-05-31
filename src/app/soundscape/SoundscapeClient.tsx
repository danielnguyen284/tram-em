'use client';

import type { Sound as DbSound } from '@/types/database';
import { useSoundStore } from '@/store/useSoundStore';
import { toPlayableSound } from '@/lib/sounds/playback';
import { Clock, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLogActivity } from '@/hooks/useLogActivity';
import styles from './soundscape.module.css';

const durationCache = new Map<string, string>();

function SoundDuration({ sound }: { sound: DbSound }) {
  const playable = toPlayableSound(sound);
  const audioUrl = playable.url;

  const [measuredDuration, setMeasuredDuration] = useState<{ url: string; value: string } | null>(null);
  const duration = durationCache.get(audioUrl)
    || (measuredDuration?.url === audioUrl ? measuredDuration.value : '')
    || sound.duration
    || '';

  useEffect(() => {
    if (!audioUrl || durationCache.has(audioUrl)) return;

    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';

    const handleLoadedMetadata = () => {
      const secs = audio.duration;
      if (!secs || isNaN(secs) || secs === Infinity) return;

      if (secs <= 20) {
        durationCache.set(audioUrl, 'Vòng lặp');
        setMeasuredDuration({ url: audioUrl, value: 'Vòng lặp' });
        return;
      }

      const mins = Math.floor(secs / 60);
      const remainingSecs = Math.floor(secs % 60);
      const formatted = `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
      durationCache.set(audioUrl, formatted);
      setMeasuredDuration({ url: audioUrl, value: formatted });
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    const timer = setTimeout(() => {
      audio.load();
    }, 100);

    return () => {
      clearTimeout(timer);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.src = '';
    };
  }, [audioUrl]);

  return <>{duration}</>;
}

type Props = {
  sounds: DbSound[];
  categories: string[];
};

export default function SoundscapeClient({ sounds, categories }: Props) {
  const allCategory = categories[0] ?? 'Tất cả';
  const [activeCategory, setActiveCategory] = useState(allCategory);
  const { addSound, activeSounds, removeSound, setPlaylist } = useSoundStore();
  const logActivity = useLogActivity();

  const playlist = useMemo(() => sounds.map(toPlayableSound), [sounds]);

  useEffect(() => {
    setPlaylist(playlist);
  }, [playlist, setPlaylist]);

  const visibleSounds = activeCategory === allCategory
    ? sounds
    : sounds.filter((sound) => sound.category === activeCategory);

  const handleToggleSound = (sound: DbSound) => {
    const isActive = activeSounds.some((s) => s.id === sound.id);
    if (isActive) {
      removeSound(sound.id);
      return;
    }

    logActivity('soundscape_play');
    addSound(toPlayableSound(sound));
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
                onClick={() => handleToggleSound(sound)}
                className={styles.playArea}
                aria-label={`${isActive ? 'Tạm dừng' : 'Phát'} ${sound.name}`}
              >
                {sound.image_url && (
                  <img src={sound.image_url} alt="" className={styles.thumbnail} />
                )}
                <span className={`${styles.playButton} ${isActive ? styles.playing : ''}`}>
                  {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </span>
              </button>
              <div className={styles.soundInfo}>
                <h2>{sound.name}</h2>
                <p className={styles.durationLine}>
                  <Clock size={14} aria-hidden="true" />
                  <SoundDuration sound={sound} />
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
