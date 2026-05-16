'use client';

import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { Sound, useSoundStore } from '@/store/useSoundStore';
import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, X } from 'lucide-react';
import styles from './MusicPlayer.module.css';

function AudioSource({ sound }: { sound: Sound }) {
  const howlRef = useRef<Howl | null>(null);

  useEffect(() => {
    howlRef.current = new Howl({
      src: [sound.url],
      loop: true,
      volume: sound.volume,
      html5: true,
    });

    if (sound.isPlaying) {
      howlRef.current.play();
    }

    return () => {
      howlRef.current?.unload();
    };
  }, [sound.url]);

  useEffect(() => {
    if (!howlRef.current) return;

    howlRef.current.volume(sound.volume);
    if (sound.isPlaying) {
      if (!howlRef.current.playing()) howlRef.current.play();
      return;
    }

    howlRef.current.pause();
  }, [sound.volume, sound.isPlaying]);

  return null;
}

export default function MusicPlayer() {
  const { activeSounds, removeSound, toggleSound, setVolume, clearAll } = useSoundStore();
  const primarySound = activeSounds[0];

  if (!primarySound) return null;

  return (
    <div className={styles.playerBar}>
      {activeSounds.map((sound) => (
        <AudioSource key={sound.id} sound={sound} />
      ))}

      <div className={styles.container}>
        <div className={styles.info}>
          {primarySound.image ? (
            <img src={primarySound.image} alt="" className={styles.cover} />
          ) : (
            <span className={styles.coverFallback}>{primarySound.icon}</span>
          )}
          <div className={styles.trackText}>
            <p className={styles.title}>{primarySound.name}</p>
            {activeSounds.length > 1 && (
              <p className={styles.subtitle}>Đang phối thêm {activeSounds.length - 1} âm thanh</p>
            )}
          </div>
        </div>

        <div className={styles.progressGroup}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={primarySound.volume}
            onChange={(event) => setVolume(primarySound.id, Number(event.target.value))}
            className={styles.progress}
            aria-label="Âm lượng"
          />
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.iconButton} aria-label="Trộn ngẫu nhiên">
            <Shuffle size={18} />
          </button>
          <button type="button" className={styles.iconButton} aria-label="Bài trước">
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={() => toggleSound(primarySound.id)}
            className={styles.mainButton}
            aria-label={primarySound.isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {primarySound.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button type="button" className={styles.iconButton} aria-label="Bài tiếp">
            <SkipForward size={18} fill="currentColor" />
          </button>
          <button type="button" className={styles.iconButton} aria-label="Lặp lại">
            <Repeat size={18} />
          </button>
          <button type="button" onClick={() => removeSound(primarySound.id)} className={styles.iconButton} aria-label="Đóng âm thanh">
            <X size={18} />
          </button>
        </div>

        <button type="button" onClick={clearAll} className={styles.clearBtn}>
          Dừng tất cả
        </button>
      </div>
    </div>
  );
}
