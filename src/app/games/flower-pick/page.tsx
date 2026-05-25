'use client';

import Shell from '@/components/layout/Shell';
import { Play, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLogActivity } from '@/hooks/useLogActivity';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './flower-pick.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────
type ItemType = 'flower' | 'cloud' | 'weed';

type GameItem = {
  id: number;
  type: ItemType;
  x: number; // % from left
  y: number; // % from top
  emoji: string;
  glowColor: string;
  size: number; // px font-size
  createdAt: number;
  ttl: number; // ms alive (flowers only)
};

type ScoreFloat = {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: 'positive' | 'negative' | 'lost';
};

type GameState = 'idle' | 'playing' | 'ended';

// ─── Constants ───────────────────────────────────────────────────────────────
const GAME_DURATION = 45; // seconds
const BOUQUET_GOAL  = 20; // flowers to fill bouquet

const FLOWER_EMOJIS: { emoji: string; glow: string }[] = [
  { emoji: '🌸', glow: 'rgba(255,174,201,0.55)' },
  { emoji: '🌺', glow: 'rgba(255,150,150,0.5)' },
  { emoji: '💜', glow: 'rgba(200,160,255,0.5)' },
  { emoji: '🌼', glow: 'rgba(255,230,100,0.5)' },
  { emoji: '🌻', glow: 'rgba(255,200,60,0.45)' },
  { emoji: '🌷', glow: 'rgba(255,140,170,0.5)' },
  { emoji: '💐', glow: 'rgba(200,190,255,0.5)' },
];

const CLOUD_EMOJIS  = ['⛅', '🌧️'];
const WEED_EMOJIS   = ['🌿', '🪲'];

const MASCOT_PICK_PHRASES = [
  'Nhặt thêm vài bông nữa nhé, bạn làm tốt lắm! 💜',
  'Ôi bông hoa đẹp quá! ✨',
  'Tiếp tục nào, bó hoa đang hình thành rồi!',
  'Hít thở nhẹ thôi, cứ từ từ nhé ♡',
  'Bạn đang làm rất tốt đó! 🌸',
  'Thêm một bông hoa cho bó hoa nhé!',
];

const MASCOT_HIT_PHRASES = [
  'Ôi, mây xám! Tránh nhé bạn ♡',
  'Không sao, cứ tiếp tục nào!',
  'Hít thở sâu, mình thử lại nhé!',
  'Cỏ gai thôi, bạn vẫn ổn mà! ♡',
];

// ─── Audio helpers ────────────────────────────────────────────────────────────
function playPickSound(ctx: AudioContext, index: number) {
  const freqs   = [523, 587, 659, 698, 784];
  const freq    = freqs[index % freqs.length];
  const osc     = ctx.createOscillator();
  const gain    = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.start(now);
  osc.stop(now + 0.5);
}

function playHitSound(ctx: AudioContext) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'triangle';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.start(now);
  osc.stop(now + 0.3);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FlowerPickPage() {
  const [gameState,   setGameState]   = useState<GameState>('idle');
  const [timer,       setTimer]       = useState(GAME_DURATION);
  const [score,       setScore]       = useState(0);
  const [items,       setItems]       = useState<GameItem[]>([]);
  const [bouquet,     setBouquet]     = useState<string[]>([]);
  const [floats,      setFloats]      = useState<ScoreFloat[]>([]);
  const [showPenalty, setShowPenalty] = useState(false);


  const audioCtxRef   = useRef<AudioContext | null>(null);
  const nextId        = useRef(0);
  const nextFloatId   = useRef(0);
  const pickCount     = useRef(0);
  const logActivity   = useLogActivity();

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ambient background music for Flower Pick
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

  const getCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // ── Spawn items ────────────────────────────────────────────────────────────
  const spawnItem = useCallback(() => {
    const rand = Math.random();
    const type: ItemType = rand < 0.55 ? 'flower' : rand < 0.78 ? 'cloud' : 'weed';

    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    let emoji = '🌸';
    let glow  = 'rgba(255,174,201,0.5)';
    let size  = 36;
    let ttl   = 4000 + Math.random() * 3000;

    if (type === 'flower') {
      const f = pick(FLOWER_EMOJIS);
      emoji   = f.emoji;
      glow    = f.glow;
      size    = 32 + Math.random() * 14;
    } else if (type === 'cloud') {
      emoji = pick(CLOUD_EMOJIS);
      size  = 30 + Math.random() * 10;
      ttl   = 5000 + Math.random() * 3000;
      glow  = 'none';
    } else {
      emoji = pick(WEED_EMOJIS);
      size  = 26 + Math.random() * 8;
      ttl   = 6000 + Math.random() * 2000;
      glow  = 'none';
    }

    const item: GameItem = {
      id: nextId.current++,
      type,
      x: 8 + Math.random() * 84,
      y: 10 + Math.random() * 72,
      emoji,
      glowColor: glow,
      size,
      createdAt: Date.now(),
      ttl,
    };

    setItems(prev => [...prev, item]);
  }, []);

  // ── Remove expired flowers ─────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') return;
    const tick = setInterval(() => {
      const now = Date.now();
      setItems(prev => {
        const toRemove = prev.filter(
          it => it.type === 'flower' && now - it.createdAt >= it.ttl,
        );
        if (toRemove.length > 0) {
          toRemove.forEach(it => {
            const fId = nextFloatId.current++;
            setFloats(f => [
              ...f,
              { id: fId, x: it.x, y: it.y, text: '🥀 tàn rồi', kind: 'lost' },
            ]);
            setTimeout(() => setFloats(f => f.filter(fl => fl.id !== fId)), 900);
          });
        }
        return prev.filter(
          it => it.type !== 'flower' || now - it.createdAt < it.ttl,
        );
      });
    }, 300);
    return () => clearInterval(tick);
  }, [gameState]);

  // ── Spawn interval ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') return;
    const spawn = setInterval(spawnItem, 1200);
    // Spawn a couple immediately
    spawnItem(); spawnItem(); spawnItem();
    return () => clearInterval(spawn);
  }, [gameState, spawnItem]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameState('ended');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // ── Click handler ──────────────────────────────────────────────────────────
  const handleItemClick = (item: GameItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameState !== 'playing') return;

    const ctx = getCtx();
    const fId = nextFloatId.current++;

    if (item.type === 'flower') {
      pickCount.current += 1;
      setScore(s => s + 1);
      setBouquet(b => [...b, item.emoji]);
      if (!isAudioMuted) playPickSound(ctx, pickCount.current);

      setItems(prev => prev.filter(it => it.id !== item.id));

      setFloats(f => [...f, { id: fId, x: item.x, y: item.y, text: '+1 🌸', kind: 'positive' }]);
      setTimeout(() => setFloats(f => f.filter(fl => fl.id !== fId)), 900);

    } else {
      // hazard hit
      setScore(s => Math.max(0, s - 1));
      if (!isAudioMuted) playHitSound(ctx);

      setShowPenalty(true);
      setTimeout(() => setShowPenalty(false), 500);
      setItems(prev => prev.filter(it => it.id !== item.id));

      const label = item.type === 'cloud' ? '☁️ -1 điểm' : '🪲 -1 điểm';
      setFloats(f => [...f, { id: fId, x: item.x, y: item.y, text: label, kind: 'negative' }]);
      setTimeout(() => setFloats(f => f.filter(fl => fl.id !== fId)), 900);
    }
  };

  // ── Start / Restart ────────────────────────────────────────────────────────
  const startGame = () => {
    getCtx();
    logActivity('game_play');
    setTimer(GAME_DURATION);
    setScore(0);
    setItems([]);
    setBouquet([]);
    setFloats([]);
    setShowPenalty(false);
    pickCount.current = 0;

    setGameState('playing');
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const bouquetPct  = Math.min(100, Math.round((bouquet.length / BOUQUET_GOAL) * 100));
  const isUrgent    = timer <= 10 && gameState === 'playing';
  const formatTime  = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Wilt fraction (0→1) for each flower based on time remaining
  const wiltFraction = (item: GameItem) => {
    if (item.type !== 'flower') return 0;
    return Math.min(1, (Date.now() - item.createdAt) / item.ttl);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Shell>
      <div className={styles.page}>
        {/* Header */}
        <header className={styles.hero}>
          <Breadcrumb items={[{ label: 'Games', href: '/games' }, { label: 'Nhặt Hoa Bình Yên' }]} />

          <div className={styles.titleBlock}>
            <div className={styles.mascot} aria-hidden="true">
              <span className={styles.mascotFace}>•ᴗ•</span>
            </div>
            <div>
              <span className={styles.category}>Vui nhộn / Thư giãn</span>
              <h1>Nhặt Hoa Bình Yên</h1>
              <p>Chạm vào những bông hoa pastel trước khi chúng tàn nhé</p>
            </div>

            <div className={styles.topActions}>
              <span className={`${styles.timerBadge} ${isUrgent ? styles.urgentTimer : ''}`}>
                🕐 {formatTime(timer)}
              </span>
              <span className={styles.scoreBadge}>⭐ Điểm: {score}</span>
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
          {/* ── Garden field ── */}
          <section className={styles.gamePanel}>
            <div className={styles.gardenContainer}>
              {/* Static painted background */}
              <div className={styles.gardenBg} aria-hidden>
                {/* Decorative sparkles */}
                {[
                  { left: '15%', top: '22%', delay: '0s'   },
                  { left: '60%', top: '18%', delay: '1.2s' },
                  { left: '80%', top: '30%', delay: '0.6s' },
                  { left: '28%', top: '55%', delay: '1.8s' },
                  { left: '72%', top: '60%', delay: '0.3s' },
                ].map((s, i) => (
                  <span
                    key={i}
                    className={styles.sparkle}
                    style={{ left: s.left, top: s.top, animationDelay: s.delay }}
                  >
                    ✦
                  </span>
                ))}
              </div>

              {/* Penalty flash */}
              {showPenalty && <div className={styles.penaltyFlash} />}

              {/* Items */}
              {items.map(item => {
                const wilt = wiltFraction(item);
                return (
                  <div
                    key={item.id}
                    className={styles.item}
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    onClick={e => handleItemClick(item, e)}
                    role="button"
                    tabIndex={0}
                    aria-label={item.type === 'flower' ? 'Nhặt hoa' : 'Hazard'}
                  >
                    {item.type === 'flower' ? (
                      <div className={styles.flowerWrapper}>
                        {item.glowColor !== 'none' && (
                          <div
                            className={styles.flowerGlow}
                            style={{ '--glow-color': item.glowColor } as React.CSSProperties}
                          />
                        )}
                        <div
                          className={styles.flowerEmoji}
                          style={{ '--flower-size': `${item.size}px` } as React.CSSProperties}
                        >
                          {item.emoji}
                        </div>
                        {/* Wilt darkening overlay */}
                        <div
                          className={styles.wiltOverlay}
                          style={{ '--wilt-opacity': wilt * 0.55 } as React.CSSProperties}
                        />
                      </div>
                    ) : item.type === 'cloud' ? (
                      <span className={styles.hazardCloud}>{item.emoji}</span>
                    ) : (
                      <span className={styles.hazardWeed}>{item.emoji}</span>
                    )}
                  </div>
                );
              })}

              {/* Floating score text */}
              {floats.map(fl => (
                <div
                  key={fl.id}
                  className={`${styles.scoreFloat} ${styles[fl.kind]}`}
                  style={{ left: `${fl.x}%`, top: `${fl.y}%` }}
                >
                  {fl.text}
                </div>
              ))}

              {/* Idle overlay */}
              {gameState === 'idle' && (
                <div className={styles.overlayScreen}>
                  <div style={{ fontSize: 48 }}>🌸</div>
                  <h2 className={styles.overlayTitle}>Nhặt Hoa Bình Yên</h2>
                  <p className={styles.overlayDesc}>
                    Chạm vào những bông hoa pastel trước khi chúng tàn. Tránh cỏ gai và mây xám để giữ điểm cao.
                  </p>
                  <button className={styles.startBtn} onClick={startGame} type="button">
                    <Play size={18} fill="#fff" /> Bắt đầu nhặt hoa
                  </button>
                </div>
              )}

              {/* Game Over overlay */}
              {gameState === 'ended' && (
                <div className={styles.overlayScreen}>
                  <div style={{ fontSize: 44 }}>💐</div>
                  <h2 className={styles.overlayTitle}>Bó hoa của bạn đây!</h2>

                  <div className={styles.resultStats}>
                    <div className={styles.statBox}>
                      <span className={styles.statNum}>{score}</span>
                      <span className={styles.statLabel}>Điểm</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statNum}>{bouquet.length}</span>
                      <span className={styles.statLabel}>Bông hoa</span>
                    </div>
                  </div>

                  {/* Mini bouquet preview */}
                  <div className={styles.bouquetDisplay}>
                    {bouquet.length === 0 ? (
                      <span className={styles.emptyBouquet}>Chưa nhặt được bông hoa nào</span>
                    ) : (
                      bouquet.slice(-20).map((emoji, i) => (
                        <span key={i} className={styles.bouquetFlower}>{emoji}</span>
                      ))
                    )}
                  </div>

                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-small)' }}>
                    Cảm ơn bạn đã dành thời gian thư giãn cùng Trạm Êm ♡
                  </p>
                  <button className={styles.startBtn} onClick={startGame} type="button">
                    <RefreshCw size={16} /> Chơi lại
                  </button>
                </div>
              )}
            </div>

            {/* Hint bar */}
            <div className={styles.hintBar}>
              <span className={styles.hintHeart}>♡</span>
              <span>Mẹo nhỏ: Hít thở sâu và chạm thật nhẹ nhé!</span>
              <span style={{ marginLeft: 'auto' }}>🍃</span>
            </div>

            {/* Actions */}
            <div className={styles.footerActions}>
              <button type="button" className={styles.replayBtn} onClick={startGame}>
                <RefreshCw size={15} /> Chơi lại
              </button>
              <Link href="/games" className={styles.continueBtn}>
                Tiếp tục →
              </Link>
            </div>
          </section>

          {/* ── Side Panel ── */}
          <aside className={styles.sidePanel}>
            {/* Bouquet progress */}
            <div className={styles.sideCard}>
              <span className={styles.cardTitle}>💐 Bó hoa bình yên</span>
              <div className={styles.bouquetTrack}>
                <div className={styles.bouquetBar} style={{ width: `${bouquetPct}%` }} />
              </div>
              <span className={styles.bouquetPct}>{bouquetPct}%</span>
            </div>

            {/* How to play */}
            <div className={styles.sideCard}>
              <span className={styles.cardTitle}>Cách chơi</span>
              <div className={styles.legend}>
                <div className={styles.legendRow}>
                  <span className={styles.legendIcon}>🌸</span>
                  <span className={styles.legendLabel}>Hoa pastel</span>
                  <span className={styles.legendDivider}>=</span>
                  <span>+1 điểm</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.legendIcon}>🌿</span>
                  <span className={styles.legendLabel}>Cỏ gai</span>
                  <span className={styles.legendDivider}>=</span>
                  <span>mất lượt</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.legendIcon}>⛅</span>
                  <span className={styles.legendLabel}>Mây xám</span>
                  <span className={styles.legendDivider}>=</span>
                  <span>trừ điểm</span>
                </div>
              </div>
            </div>



            {/* Collected bouquet */}
            <div className={styles.sideCard}>
              <span className={styles.cardTitle}>💗 Bó hoa của bạn</span>
              <div className={styles.bouquetDisplay}>
                {bouquet.length === 0 ? (
                  <span className={styles.emptyBouquet}>Chưa có hoa nào…</span>
                ) : (
                  bouquet.slice(-24).map((emoji, i) => (
                    <span key={i} className={styles.bouquetFlower}>{emoji}</span>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
