'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, X } from 'lucide-react';
import { useSoundStore } from '@/store/useSoundStore';
import styles from './MusicPlayer.module.css';

export default function MusicPlayer() {
  const {
    activeSounds,
    removeSound,
    toggleSound,
    clearAll,
    playNext,
    playPrevious,
    repeatEnabled,
    shuffleEnabled,
    toggleRepeat,
    toggleShuffle,
  } = useSoundStore();
  const primarySound = activeSounds[0];
  const primarySoundId = primarySound?.id;
  const primarySoundName = primarySound?.name ?? 'sound';
  const primarySoundUrl = primarySound?.url;
  const primarySoundVolume = primarySound?.volume ?? 0.65;
  const howlRef = useRef<Howl | null>(null);
  const frameRef = useRef<number | null>(null);
  const repeatRef = useRef(repeatEnabled);
  const shouldPlayRef = useRef(primarySound?.isPlaying ?? false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    repeatRef.current = repeatEnabled;
  }, [repeatEnabled]);

  useEffect(() => {
    shouldPlayRef.current = primarySound?.isPlaying ?? false;
  }, [primarySound?.isPlaying]);

  const stopProgressLoop = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const syncProgress = useCallback(function updateProgress() {
    const howl = howlRef.current;
    if (!howl) return;

    const currentDuration = howl.duration();
    const seek = howl.seek();
    const curTime = typeof seek === 'number' ? seek : 0;

    setDuration(currentDuration || 0);
    setCurrentTime(curTime);
    setProgress(currentDuration ? curTime / currentDuration : 0);

    if (howl.playing()) {
      frameRef.current = window.requestAnimationFrame(updateProgress);
    }
  }, []);

  useEffect(() => {
    if (!primarySoundId || !primarySoundUrl) return;

    stopProgressLoop();
    setProgress(0);
    setDuration(0);
    setCurrentTime(0);

    howlRef.current = new Howl({
      src: [primarySoundUrl],
      loop: repeatRef.current,
      volume: primarySoundVolume,
      html5: true,
      preload: true,
      onload: () => {
        setDuration(howlRef.current?.duration() ?? 0);
      },
      onplay: syncProgress,
      onpause: stopProgressLoop,
      onstop: stopProgressLoop,
      onend: () => {
        stopProgressLoop();
        setProgress(0);
        setCurrentTime(0);
        if (!repeatRef.current) {
          playNext();
        }
      },
      onloaderror: (_id, error) => {
        console.warn(`Unable to load sound "${primarySoundName}" from ${primarySoundUrl}`, error);
      },
      onplayerror: () => {
        howlRef.current?.once('unlock', () => {
          if (shouldPlayRef.current) {
            howlRef.current?.play();
          }
        });
      },
    });

    if (shouldPlayRef.current) {
      howlRef.current.play();
    }

    return () => {
      stopProgressLoop();
      howlRef.current?.unload();
      howlRef.current = null;
    };
  }, [playNext, primarySoundId, primarySoundName, primarySoundUrl, primarySoundVolume, stopProgressLoop, syncProgress]);

  useEffect(() => {
    const howl = howlRef.current;
    if (!howl || !primarySound) return;

    howl.loop(repeatEnabled);
    howl.volume(primarySound.volume);

    if (primarySound.isPlaying) {
      if (!howl.playing()) howl.play();
      return;
    }

    howl.pause();
  }, [primarySound, repeatEnabled]);

  const handleSeek = (value: number) => {
    const howl = howlRef.current;
    if (!howl || !duration) return;

    const newTime = value * duration;
    howl.seek(newTime);
    setProgress(value);
    setCurrentTime(newTime);
  };

  if (!primarySound) return null;

  return (
    <div className={styles.playerBar}>
      <div className={styles.container}>
        <div className={styles.info}>
          {primarySound.image ? (
            <img src={primarySound.image} alt="" className={styles.cover} />
          ) : (
            <span className={styles.coverFallback}>{primarySound.icon}</span>
          )}
          <div className={styles.trackText}>
            <p className={styles.title}>{primarySound.name}</p>
            <p className={styles.subtitle}>
              {duration > 0 ? (duration <= 20 ? 'Vòng lặp' : formatTime(duration)) : (primarySound.duration ?? primarySound.category)}
            </p>
          </div>
        </div>

        <div className={styles.progressGroup}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={progress}
            onChange={(event) => handleSeek(Number(event.target.value))}
            className={styles.progress}
            aria-label="Tiến trình phát"
          />
          <div className={styles.timeWrapper}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            onClick={toggleShuffle}
            className={`${styles.iconButton} ${shuffleEnabled ? styles.activeButton : ''}`}
            aria-label="Trộn ngẫu nhiên"
            aria-pressed={shuffleEnabled}
          >
            <Shuffle size={18} />
          </button>
          <button type="button" onClick={playPrevious} className={styles.iconButton} aria-label="Bài trước">
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
          <button type="button" onClick={playNext} className={styles.iconButton} aria-label="Bài tiếp">
            <SkipForward size={18} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={toggleRepeat}
            className={`${styles.iconButton} ${repeatEnabled ? styles.activeButton : ''}`}
            aria-label="Lặp lại"
            aria-pressed={repeatEnabled}
          >
            <Repeat size={18} />
          </button>
          <button type="button" onClick={() => removeSound(primarySound.id)} className={styles.iconButton} aria-label="Đóng âm thanh">
            <X size={18} />
          </button>
        </div>

        <button type="button" onClick={clearAll} className={styles.clearBtn}>
          Dừng
        </button>
      </div>
    </div>
  );
}
