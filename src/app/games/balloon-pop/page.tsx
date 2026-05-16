'use client';

import Shell from '@/components/layout/Shell';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import styles from './balloon-pop.module.css';

const COLS = 10;
const ROWS = 7;
const TOTAL = COLS * ROWS;

const COLORS = [
  '#c8a4e8', // lavender
  '#f4a8c0', // pink
  '#a8d8b9', // mint
  '#f7c59f', // peach
  '#a8c8f0', // sky blue
  '#f9e0a8', // yellow
];

function createBalloons() {
  return Array.from({ length: TOTAL }, (_, i) => ({
    id: i,
    popped: false,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
}

// Web Audio synth pop sound — no file needed
function playPopSound(audioCtx: AudioContext) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(480, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.start(now);
  osc.stop(now + 0.15);
}

export default function BalloonPopPage() {
  const [balloons, setBalloons] = useState(createBalloons);
  const [popped, setPopped] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ambient background music
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=relaxing-145038.mp3');
    audio.loop = true;
    audio.volume = 0.18;
    audio.play().catch(() => {});
    ambientRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  const getAudioCtx = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }
    if (audioRef.current.state === 'suspended') {
      audioRef.current.resume();
    }
    return audioRef.current;
  }, []);

  const popBalloon = useCallback((id: number) => {
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    setPopped(prev => prev + 1);
    playPopSound(getAudioCtx());
  }, [getAudioCtx]);

  const reset = useCallback(() => {
    setBalloons(createBalloons());
    setPopped(0);
  }, []);

  return (
    <Shell>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <Link href="/games" className={styles.backBtn}>
            <ArrowLeft size={18} /> Quay lại
          </Link>
          <span className={styles.counter}>🎈 {popped} / {TOTAL} bóng đã bóp</span>
        </div>

        {popped === TOTAL && (
          <div className={styles.completeBanner}>
            🎉 Tuyệt vời! Bạn đã bóp hết tất cả bóng rồi!
          </div>
        )}

        <div className={styles.grid}>
          {balloons.map(b => (
            <button
              key={b.id}
              className={`${styles.balloon} ${b.popped ? styles.popped : ''}`}
              style={{ '--balloon-color': b.color } as React.CSSProperties}
              onClick={() => !b.popped && popBalloon(b.id)}
              disabled={b.popped}
              aria-label={b.popped ? 'Bóng đã bóp' : 'Bóp bóng'}
            />
          ))}
        </div>

        <button className={styles.resetBtn} onClick={reset}>
          <RefreshCw size={16} /> Tấm mới
        </button>
      </div>
    </Shell>
  );
}
