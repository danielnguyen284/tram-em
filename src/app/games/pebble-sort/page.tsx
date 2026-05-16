'use client';

import Shell from '@/components/layout/Shell';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shuffle } from 'lucide-react';
import styles from './pebble-sort.module.css';

const COLORS = [
  { id: 'blue',   label: 'Xanh dương', value: '#a8c8f0' },
  { id: 'green',  label: 'Xanh lá',    value: '#a8d8b9' },
  { id: 'purple', label: 'Tím nhạt',   value: '#c8a4e8' },
  { id: 'yellow', label: 'Vàng nhạt',  value: '#f7c59f' },
];

const COLS = 8;
const ROWS = 2;
const TOTAL = COLS * ROWS;

function generatePebbles() {
  const base: string[] = [];
  for (let i = 0; i < TOTAL / COLORS.length; i++) {
    COLORS.forEach(c => base.push(c.value));
  }
  // Fisher-Yates shuffle
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base.map((color, idx) => ({ id: idx, color }));
}

// Synth click sound
function playClickSound(audioCtx: AudioContext) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.start(now);
  osc.stop(now + 0.09);
}

export default function PebbleSortPage() {
  const [pebbles, setPebbles] = useState(generatePebbles);
  const [selected, setSelected] = useState<number | null>(null);
  const [swaps, setSwaps] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/01/18/audio_2744888898.mp3?filename=frogs-and-crickets-7142.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    audio.play().catch(() => {});
    ambientRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const handlePebbleClick = useCallback((id: number) => {
    playClickSound(getAudioCtx());

    if (selected === null) {
      setSelected(id);
      return;
    }
    if (selected === id) {
      setSelected(null);
      return;
    }
    // Swap
    setPebbles(prev => {
      const next = [...prev];
      const a = next.findIndex(p => p.id === selected);
      const b = next.findIndex(p => p.id === id);
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
    setSwaps(s => s + 1);
    setSelected(null);
  }, [selected, getAudioCtx]);

  const shuffle = useCallback(() => {
    setPebbles(generatePebbles());
    setSwaps(0);
    setSelected(null);
  }, []);

  return (
    <Shell>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <Link href="/games" className={styles.backBtn}>
            <ArrowLeft size={18} /> Quay lại
          </Link>
          <span className={styles.counter}>🪨 Sắp xếp sỏi theo màu — {swaps} lần hoán đổi</span>
        </div>

        <div className={styles.grid} style={{ '--cols': COLS } as React.CSSProperties}>
          {pebbles.map(p => (
            <button
              key={p.id}
              className={`${styles.pebble} ${selected === p.id ? styles.selected : ''}`}
              style={{ '--pebble-color': p.color } as React.CSSProperties}
              onClick={() => handlePebbleClick(p.id)}
              aria-label="Viên sỏi"
            />
          ))}
        </div>

        <div className={styles.legend}>
          {COLORS.map(c => (
            <span key={c.id} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: c.value }} />
              {c.label}
            </span>
          ))}
        </div>

        <button className={styles.shuffleBtn} onClick={shuffle}>
          <Shuffle size={16} /> Xáo trộn mới
        </button>
      </div>
    </Shell>
  );
}
