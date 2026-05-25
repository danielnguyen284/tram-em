'use client';

import Shell from '@/components/layout/Shell';
import { Clock, Lightbulb, Play, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLogActivity } from '@/hooks/useLogActivity';
import styles from './calm-lights.module.css';

type Lamp = {
  id: number;
  name: string;
  left: string;
  wireHeight: number;
  colorBright: string;
  colorBorder: string;
  colorShadow: string;
  colorBeam: string;
};

type HitParticle = {
  id: number;
  left: string;
  top: string;
  text: string;
  dx: number;
  dy: number;
};

const LAMPS: Lamp[] = [
  {
    id: 0,
    name: 'Đèn hồng',
    left: '12%',
    wireHeight: 80,
    colorBright: '#FFAEC9',
    colorBorder: '#E58BA3',
    colorShadow: 'rgba(255, 174, 201, 0.8)',
    colorBeam: 'rgba(255, 174, 201, 0.4)',
  },
  {
    id: 1,
    name: 'Đèn tím',
    left: '28%',
    wireHeight: 140,
    colorBright: '#D4C5FF',
    colorBorder: '#A694DC',
    colorShadow: 'rgba(212, 197, 255, 0.8)',
    colorBeam: 'rgba(212, 197, 255, 0.4)',
  },
  {
    id: 2,
    name: 'Đèn vàng',
    left: '44%',
    wireHeight: 65,
    colorBright: '#FFEDB3',
    colorBorder: '#DCBD68',
    colorShadow: 'rgba(255, 237, 179, 0.8)',
    colorBeam: 'rgba(255, 237, 179, 0.4)',
  },
  {
    id: 3,
    name: 'Đèn xanh dương',
    left: '60%',
    wireHeight: 120,
    colorBright: '#C1E3FF',
    colorBorder: '#8CADE1',
    colorShadow: 'rgba(193, 227, 255, 0.8)',
    colorBeam: 'rgba(193, 227, 255, 0.4)',
  },
  {
    id: 4,
    name: 'Đèn oải hương',
    left: '76%',
    wireHeight: 90,
    colorBright: '#E8C6FF',
    colorBorder: '#BC9ED7',
    colorShadow: 'rgba(232, 198, 255, 0.8)',
    colorBeam: 'rgba(232, 198, 255, 0.4)',
  },
  {
    id: 5,
    name: 'Đèn bạc hà',
    left: '92%',
    wireHeight: 150,
    colorBright: '#C6F4D6',
    colorBorder: '#99D1AB',
    colorShadow: 'rgba(198, 244, 214, 0.8)',
    colorBeam: 'rgba(198, 244, 214, 0.4)',
  },
];

const MASCOT_HAPPY_PHRASES = [
  'Giỏi lắm nè! ♡',
  'Hít sâu thở đều nào...',
  'Tuyệt cú mèo!',
  'Đúng rồi đó!',
  'Bạn giữ nhịp tốt lắm! ♡',
  'Căn phòng đang sáng dần kìa!',
  'Cứ bình tĩnh thư giãn nhé...',
  'Làm tốt lắm bạn ơi!',
];

const MASCOT_CALM_PHRASES = [
  'Không sao đâu nè, từ từ lại nhé ♡',
  'Hít sâu một hơi thật dài nào...',
  'Bạn đang làm rất tốt, bình tĩnh nhé',
  'Nhắm mắt lại hít thở một nhịp xem sao...',
  'Cùng thư giãn cơ thể nào!',
  'Trò chơi chỉ để giải tỏa căng thẳng thôi nè ♡',
];

const PENTATONIC_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

export default function CalmLightsPage() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [timer, setTimer] = useState(45);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [brightness, setBrightness] = useState(20);
  const [activeLampIndex, setActiveLampIndex] = useState<number | null>(null);

  const [particles, setParticles] = useState<HitParticle[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientMusicRef = useRef<HTMLAudioElement | null>(null);
  const nextParticleId = useRef(0);
  const isCorrectClickedRef = useRef(false);
  const logActivity = useLogActivity();

  const activeLampIndexRef = useRef<number | null>(null);

  // Keep activeLampIndexRef in sync
  useEffect(() => {
    activeLampIndexRef.current = activeLampIndex;
  }, [activeLampIndex]);

  // Initialize Web Audio context
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Play peaceful synth chime for hit
  const playHitSound = useCallback((comboCount: number) => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Select frequency based on combo count (up the pentatonic scale)
      const scaleIndex = comboCount % PENTATONIC_SCALE.length;
      const freq = PENTATONIC_SCALE[scaleIndex];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      // Soft vibrato
      osc.frequency.linearRampToValueAtTime(freq + 5, now + 0.1);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.error(e);
    }
  }, [getAudioCtx, isAudioMuted]);

  // Play low calming sound for miss/mistake
  const playMissSound = useCallback(() => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      // Low relaxing grounding frequency (174Hz Solfeggio or similar relaxing tone)
      osc.frequency.setValueAtTime(174, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.25);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.error(e);
    }
  }, [getAudioCtx, isAudioMuted]);

  // Background Ambient Lofi music loop
  useEffect(() => {
    const ambient = new Audio('https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=relaxing-145038.mp3');
    ambient.loop = true;
    ambient.volume = isAudioMuted ? 0 : 0.12;
    ambientMusicRef.current = ambient;

    return () => {
      ambient.pause();
    };
  }, []);

  // Update volume of background track when muted
  useEffect(() => {
    if (ambientMusicRef.current) {
      ambientMusicRef.current.volume = isAudioMuted ? 0 : 0.12;
    }
  }, [isAudioMuted]);

  // Main countdown timer effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTimer((prev) => {
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

  // Lamp rhythm effect: rotates active lamp every 1.5s
  useEffect(() => {
    if (gameState !== 'playing') {
      setActiveLampIndex(null);
      return;
    }

    const selectNextLamp = () => {
      const currentActive = activeLampIndexRef.current;
      // If the player did not click the previous lamp, treat it as a gentle miss
      if (currentActive !== null && !isCorrectClickedRef.current) {
        setCombo((prev) => {
          if (prev > 0) {
            setMascotBubble(MASCOT_CALM_PHRASES[Math.floor(Math.random() * MASCOT_CALM_PHRASES.length)]);
            playMissSound();
            return 0;
          }
          return 0;
        });
      }

      isCorrectClickedRef.current = false;
      setActiveLampIndex((current) => {
        let next = Math.floor(Math.random() * LAMPS.length);
        while (current !== null && next === current) {
          next = Math.floor(Math.random() * LAMPS.length);
        }
        return next;
      });
    };

    // Spawn first lamp immediately
    selectNextLamp();

    const rhythm = setInterval(selectNextLamp, 1500);

    return () => clearInterval(rhythm);
  }, [gameState, playMissSound]);

  const startGame = () => {
    getAudioCtx();
    logActivity('game_play');
    if (ambientMusicRef.current) {
      ambientMusicRef.current.play().catch(() => {});
    }
    setTimer(45);
    setCombo(0);
    setMaxCombo(0);
    setBrightness(20);
    setParticles([]);

    isCorrectClickedRef.current = false;
    setGameState('playing');
  };

  const resetGame = () => {
    startGame();
  };

  const handleLampClick = (lampId: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;

    const clickedLamp = LAMPS[lampId];

    if (lampId === activeLampIndex && !isCorrectClickedRef.current) {
      // Hit correct glowing lamp!
      isCorrectClickedRef.current = true;
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      setBrightness((prev) => Math.min(100, prev + 5));

      // Visual particles spawn
      const rect = event.currentTarget.getBoundingClientRect();
      const parentRect = event.currentTarget.parentElement?.getBoundingClientRect();

      let x = clickedLamp.left;
      let y = `${clickedLamp.wireHeight + 25}px`;

      if (rect && parentRect) {
        // Precise relative center calculation
        x = `${((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100}%`;
        y = `${rect.top - parentRect.top + rect.height / 2}px`;
      }

      const pId = nextParticleId.current++;
      const pText = nextCombo % 5 === 0 ? `✨ Combo x${nextCombo}! ✨` : `+1`;
      const newParticle: HitParticle = {
        id: pId,
        left: x,
        top: y,
        text: pText,
        dx: (Math.random() - 0.5) * 60,
        dy: -(Math.random() * 30 + 40),
      };

      setParticles((prev) => [...prev, newParticle]);
      // Cleanup particle after 1s
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== pId));
      }, 1000);

      // Sound and voice bubble feedback
      playHitSound(nextCombo);


    } else if (lampId !== activeLampIndex) {
      // Clicked dark lamp - mistake
      setCombo((prev) => {
        if (prev > 0) {
          playMissSound();

          return 0;
        }
        return 0;
      });
      setBrightness((prev) => Math.max(15, prev - 3));
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Shell>
      <div className={styles.page}>
        <header className={styles.hero}>
          <Breadcrumb items={[{ label: 'Games', href: '/games' }, { label: 'Bấm Đèn Bình Tĩnh' }]} />
          <div className={styles.titleBlock}>
            <div className={styles.mascot} aria-hidden="true">
              <span className={styles.mascotFace}>•ᴗ•</span>
            </div>
            <div>
              <span className={styles.category}>Vui nhộn / Tập trung</span>
              <h1>Bấm Đèn Bình Tĩnh</h1>
              <p>Nhấn đúng chiếc đèn đang sáng theo nhịp để giữ tâm trí bình tĩnh và thắp sáng căn phòng ấm áp.</p>
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
          <section className={styles.gamePanel}>
            <div className={styles.roomContainer}>
              {/* Stars & Moon base */}
              <div className={styles.roomBackground}>
                <div className={styles.windowArched}>
                  <div className={styles.windowGridHorizontal} />
                  <div className={styles.windowGridVertical} />
                  <div className={styles.stars} />
                  <div className={styles.crescentMoon} />
                </div>
                <div className={styles.cloudDeco} />
              </div>

              {/* Dynamic room brightness overlays */}
              <div
                className={styles.roomLightOverlay}
                style={{ opacity: brightness / 100 }}
              />
              <div
                className={styles.roomDarkOverlay}
                style={{ opacity: 1 - brightness / 100 }}
              />
              <div
                className={styles.roomGoldenGlow}
                style={{ opacity: Math.max(0, (brightness - 30) / 70) }}
              />

              {/* Lamps Area */}
              <div className={styles.lampsArea}>
                {LAMPS.map((lamp) => {
                  const isActive = activeLampIndex === lamp.id;
                  return (
                    <div
                      key={lamp.id}
                      className={`${styles.lampContainer} ${isActive ? styles.active : ''}`}
                      style={{
                        left: lamp.left,
                        '--wire-height': `${lamp.wireHeight}px`,
                        '--lamp-color-bright': lamp.colorBright,
                        '--lamp-color-border': lamp.colorBorder,
                        '--lamp-color-shadow': lamp.colorShadow,
                        '--lamp-color-beam': lamp.colorBeam,
                      } as React.CSSProperties}
                      onClick={(e) => handleLampClick(lamp.id, e)}
                    >
                      <div className={styles.wire} />
                      <div className={styles.lampCap} />
                      <div className={styles.lampShade} />
                      <div className={styles.bulb} />
                      <div className={styles.lightBeam} />
                    </div>
                  );
                })}
              </div>

              {/* Decorative Sofa Pillow Silhouettes */}
              <div className={styles.furnitureLayer}>
                <div className={styles.bookshelf}>
                  <div className={styles.books}>
                    <div className={styles.book} style={{ '--h': '26px', '--c': '#FFAEC9' } as React.CSSProperties} />
                    <div className={styles.book} style={{ '--h': '30px', '--c': '#D4C5FF' } as React.CSSProperties} />
                    <div className={styles.book} style={{ '--h': '22px', '--c': '#C6F4D6' } as React.CSSProperties} />
                  </div>
                  <div className={styles.shelfLine} />
                  <div className={styles.books}>
                    <div className={styles.book} style={{ '--h': '24px', '--c': '#FFEDB3' } as React.CSSProperties} />
                    <div className={styles.book} style={{ '--h': '28px', '--c': '#C1E3FF' } as React.CSSProperties} />
                  </div>
                  <div className={styles.shelfLine} />
                  <div className={styles.plantPot}>
                    <div className={styles.plantLeaves} />
                  </div>
                </div>

                <div className={styles.bedSofa}>
                  <div className={styles.pillowStar} />
                  <div className={styles.pillowRound} />
                </div>
              </div>

              {/* Spawning Hit Particles */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  className={styles.hitParticle}
                  style={{
                    left: p.left,
                    top: p.top,
                    '--dx': `${p.dx}px`,
                    '--dy': `${p.dy}px`,
                  } as React.CSSProperties}
                >
                  {p.text}
                </div>
              ))}

              {/* Active Combo Float Banner */}
              {combo > 0 && (
                <div className={styles.comboIndicator}>
                  ✨ Combo x{combo} ✨
                </div>
              )}

              {/* Game Over Screen */}
              {gameState === 'ended' && (
                <div className={styles.readyOverlay}>
                  <h3 className={styles.readyTitle}>Căn phòng tràn ngập ấm áp! ✨</h3>
                  <p className={styles.readyDesc} style={{ color: '#FDF8F7' }}>
                    Bạn đã thắp sáng căn phòng lên đến <strong>{brightness}%</strong> với chuỗi combo lớn nhất là <strong>{maxCombo}</strong>.
                  </p>
                  <p className={styles.readyDesc} style={{ fontSize: '13px', opacity: 0.8 }}>
                    Cảm ơn bạn đã đồng hành cùng Trạm Êm. Hít thở sâu và mang nhịp điệu bình tĩnh này vào cuộc sống nhé ♡
                  </p>
                  <button type="button" className={styles.playBtn} onClick={startGame}>
                    <RefreshCw size={18} /> Chơi lại
                  </button>
                </div>
              )}

              {/* Initial Startup screen */}
              {gameState === 'idle' && (
                <div className={styles.readyOverlay}>
                  <h3 className={styles.readyTitle}>Bấm Đèn Bình Tĩnh</h3>
                  <p className={styles.readyDesc}>
                    Bấm đúng chiếc đèn đang sáng theo nhịp để thắp sáng căn phòng ấm áp và thư giãn tâm trí.
                  </p>
                  <button type="button" className={styles.playBtn} onClick={startGame}>
                    <Play size={18} fill="#fff" /> Bắt đầu thắp sáng
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className={styles.sidePanel}>
            {/* Timer card */}
            <div className={styles.sideCard}>
              <div className={styles.cardHeaderRow}>
                <span className={styles.cardTitle}>Thời gian</span>
                <div className={styles.iconCircle}>
                  <Clock size={18} />
                </div>
              </div>
              <strong className={styles.hugeValue}>{formatTime(timer)}</strong>
            </div>

            {/* Brightness progress card */}
            <div className={styles.sideCard}>
              <div className={styles.cardHeaderRow}>
                <span className={styles.cardTitle}>Căn phòng sáng</span>
                <div className={styles.iconCircle}>
                  <Lightbulb size={18} />
                </div>
              </div>
              <strong className={styles.hugeValue}>{brightness}%</strong>
              <div className={styles.progressTrack} aria-label={`Độ sáng phòng ${brightness}%`}>
                <div className={styles.progressBar} style={{ width: `${brightness}%` }} />
              </div>
              <div className={styles.percentageRow}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Instruction card */}
            <div className={styles.sideCard}>
              <span className={styles.cardTitle} style={{ marginBottom: '4px' }}>Cách chơi</span>
              <div className={styles.instructionsList}>
                <div className={styles.instructionItem}>
                  <span className={styles.instructionNum}>1</span>
                  <p>Click vào chiếc đèn đang sáng.</p>
                </div>
                <div className={styles.instructionItem}>
                  <span className={styles.instructionNum}>2</span>
                  <p>Giữ chuỗi đúng để tạo combo.</p>
                </div>
                <div className={styles.instructionItem}>
                  <span className={styles.instructionNum}>3</span>
                  <p>Thắp sáng căn phòng thật ấm áp nhé!</p>
                </div>
              </div>
            </div>



            <div className={styles.sideCard} style={{ flexDirection: 'row' }}>
              <button type="button" onClick={resetGame} className={`${styles.actionBtn} ${styles.replayBtn}`} style={{ flex: 1, justifyContent: 'center' }}>
                <RefreshCw size={16} />
                <span>Chơi lại</span>
              </button>
              <Link href="/games" className={`${styles.actionBtn} ${styles.continueBtn}`} style={{ flex: 1, justifyContent: 'center' }}>
                <span>Tiếp tục</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
