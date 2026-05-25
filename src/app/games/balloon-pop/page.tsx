'use client';

import Shell from '@/components/layout/Shell';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, Volume2, VolumeX } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
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

function createBalloons(deterministic = false) {
  return Array.from({ length: TOTAL }, (_, i) => ({
    id: i,
    popped: false,
    color: deterministic ? COLORS[i % COLORS.length] : COLORS[Math.floor(Math.random() * COLORS.length)],
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
  const [balloons, setBalloons] = useState(() => createBalloons(true));
  const [popped, setPopped] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    // Ambient background music
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=relaxing-145038.mp3');
    audio.loop = true;
    audio.volume = isAudioMuted ? 0 : 0.18;
    audio.play().catch(() => {});
    ambientRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = isAudioMuted ? 0 : 0.18;
    }
  }, [isAudioMuted]);

  useEffect(() => {
    setBalloons(createBalloons(false));
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
    if (!isAudioMuted) {
      playPopSound(getAudioCtx());
    }
  }, [getAudioCtx, isAudioMuted]);

  const reset = useCallback(() => {
    setBalloons(createBalloons(false));
    setPopped(0);
  }, []);

  return (
    <Shell>
      <div className={styles.page}>
        <header className={styles.hero}>
          <Breadcrumb items={[{ label: 'Games', href: '/games' }, { label: 'Bóp Bóng' }]} />
          <div className={styles.titleBlock}>
            <div className={styles.mascot} aria-hidden="true">
              <span className={styles.mascotFace}>•ᴗ•</span>
            </div>
            <div>
              <span className={styles.category}>Vui nhộn / Giải tỏa</span>
              <h1>Bóp Bóng</h1>
              <p>Thả lỏng tay và nhẹ nhàng bóp vỡ từng quả bóng để giải tỏa căng thẳng.</p>
            </div>
            
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className={styles.muteBtn}
              title={isAudioMuted ? 'Mở âm thanh' : 'Tắt âm thanh'}
              type="button"
            >
              {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isAudioMuted ? 'Tắt tiếng' : 'Mở tiếng'}</span>
            </button>
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.gamePanel}>

          <div className={styles.gameBoard}>
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
          </div>
        </div>

        <div className={styles.sidePanel}>
          <div className={styles.sideCard}>
            <h3 className={styles.cardTitle}>Tiến độ</h3>
            <div className={styles.statValue}>{popped} / {TOTAL}</div>
            <div className={styles.statLabel}>Bóng đã bóp</div>
          </div>

          <div className={styles.sideCard}>
            <h3 className={styles.cardTitle}>Cách chơi</h3>
            <div className={styles.instructionsList}>
              <div className={styles.instructionItem}>
                <div className={styles.instructionNum}>1</div>
                <span>Thả lỏng tay và bấm vào từng quả bóng.</span>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionNum}>2</div>
                <span>Nghe tiếng "pop" nhẹ nhàng để giải tỏa căng thẳng.</span>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionNum}>3</div>
                <span>Bóp hết tất cả bóng để hoàn thành.</span>
              </div>
            </div>
          </div>



          <div className={styles.sideCard}>
            <button className={styles.resetBtn} onClick={reset}>
              <RefreshCw size={16} /> Bơm bóng mới
            </button>
          </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
