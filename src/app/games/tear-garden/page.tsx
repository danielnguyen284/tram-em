'use client';

import Shell from '@/components/layout/Shell';
import { Pause, Play, RefreshCw } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './tear-garden.module.css';

type Tear = {
  id: number;
  x: number;
  y: number;
  speed: number;
  tone: string;
};

const GOAL = 10;
const CATCH_Y = 72;
const CATCH_RANGE = 13;
const TEAR_TONES = ['blue', 'pink', 'purple', 'mint'];

function createTear(id: number): Tear {
  return {
    id,
    x: 10 + Math.random() * 80,
    y: -12,
    speed: 1.1 + Math.random() * 0.8,
    tone: TEAR_TONES[Math.floor(Math.random() * TEAR_TONES.length)],
  };
}

function clampLeaf(value: number) {
  return Math.min(88, Math.max(12, value));
}

export default function TearGardenPage() {
  const [tears, setTears] = useState<Tear[]>(() => [createTear(1), createTear(2), createTear(3)]);
  const [leafX, setLeafX] = useState(50);
  const [flowers, setFlowers] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [softMisses, setSoftMisses] = useState(0);
  const nextId = useRef(4);
  const leafRef = useRef(50);
  const flowersRef = useRef(0);
  const pausedRef = useRef(false);

  const isComplete = flowers >= GOAL;
  const progress = Math.min(100, (flowers / GOAL) * 100);

  const gardenFlowers = useMemo(
    () => Array.from({ length: Math.min(flowers, GOAL) }, (_, index) => ({
      id: index,
      left: 9 + index * 8.9,
      delay: `${index * 0.05}s`,
      tone: TEAR_TONES[index % TEAR_TONES.length],
    })),
    [flowers],
  );

  useEffect(() => {
    leafRef.current = leafX;
  }, [leafX]);

  useEffect(() => {
    flowersRef.current = flowers;
  }, [flowers]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  const moveLeaf = useCallback((delta: number) => {
    setLeafX((value) => clampLeaf(value + delta));
  }, []);

  const resetGame = useCallback(() => {
    nextId.current = 4;
    setTears([createTear(1), createTear(2), createTear(3)]);
    setLeafX(50);
    setFlowers(0);
    setSoftMisses(0);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        event.preventDefault();
        moveLeaf(-5);
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        event.preventDefault();
        moveLeaf(5);
      }
      if (event.key === ' ') {
        event.preventDefault();
        setIsPaused((value) => !value);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [moveLeaf]);

  useEffect(() => {
    const spawnTimer = window.setInterval(() => {
      if (pausedRef.current || flowersRef.current >= GOAL) return;
      setTears((current) => {
        if (current.length >= 7) return current;
        const tear = createTear(nextId.current);
        nextId.current += 1;
        return [...current, tear];
      });
    }, 850);

    return () => window.clearInterval(spawnTimer);
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      if (pausedRef.current || flowersRef.current >= GOAL) return;

      setTears((current) => {
        const next: Tear[] = [];
        let caught = 0;
        let missed = 0;

        current.forEach((tear) => {
          const moved = { ...tear, y: tear.y + tear.speed };
          const isCatchZone = moved.y >= CATCH_Y && moved.y <= CATCH_Y + 10;
          const isCaught = isCatchZone && Math.abs(moved.x - leafRef.current) <= CATCH_RANGE;

          if (isCaught) {
            caught += 1;
            return;
          }

          if (moved.y > 104) {
            missed += 1;
            return;
          }

          next.push(moved);
        });

        if (caught > 0) {
          setFlowers((value) => Math.min(GOAL, value + caught));
        }
        if (missed > 0) {
          setSoftMisses((value) => value + missed);
        }

        return next;
      });
    }, 45);

    return () => window.clearInterval(tick);
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = ((event.clientX - rect.left) / rect.width) * 100;
    setLeafX(clampLeaf(nextX));
  };

  return (
    <Shell>
      <div className={styles.page}>
        <header className={styles.hero}>
          <Breadcrumb items={[{ label: 'Games', href: '/games' }, { label: 'Đỡ Giọt Nước Mắt' }]} />
          <div className={styles.titleBlock}>
            <div className={styles.mascot} aria-hidden="true">
              <span className={styles.mascotFace}>•ᴗ•</span>
            </div>
            <div>
              <span className={styles.category}>Chữa lành / Action nhẹ</span>
              <h1>Đỡ Giọt Nước Mắt</h1>
              <p>Hướng những giọt nước mắt bằng chiếc lá êm. Khi đủ yêu thương, chúng sẽ nở thành hoa.</p>
            </div>
          </div>
        </header>

        <main className={styles.layout}>
          <section className={styles.gamePanel}>
            <div className={styles.statusBar}>
              <div className={styles.progressLabel}>
                <span>Hoa đã nở</span>
                <strong>{flowers}/{GOAL}</strong>
              </div>
              <div className={styles.progressTrack} aria-label={`Hoa đã nở ${flowers} trên ${GOAL}`}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.softCounter}>{softMisses} giọt đã rơi nhẹ</span>
            </div>

            <div className={styles.sky} onPointerMove={handlePointerMove}>
              <div className={styles.vines} aria-hidden="true" />
              <div className={styles.fireflies} aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={styles.firefly} />
                ))}
              </div>
              
              {tears.map((tear) => (
                <div
                  key={tear.id}
                  className={styles.tearWrapper}
                  style={{ left: `${tear.x}%`, top: `${tear.y}%` }}
                >
                  <div className={`${styles.tear} ${styles[tear.tone]}`}>
                    <span className={styles.tearGlow} />
                  </div>
                </div>
              ))}

              <div className={styles.catcher} style={{ left: `${leafX}%` }}>
                <div className={styles.leafBowl}>
                  {gardenFlowers.slice(-5).map((flower) => (
                    <span key={flower.id} className={`${styles.miniFlower} ${styles[flower.tone]}`} />
                  ))}
                </div>
                <div className={styles.cloudBase}>•ᴗ•</div>
              </div>

              {isComplete && (
                <div className={styles.completeOverlay}>
                  <strong>Vườn hoa đã nở</strong>
                  <span>10 giọt dịu dàng đã thành hoa nhỏ.</span>
                </div>
              )}
            </div>

            <div className={styles.controls}>
              <button type="button" onClick={() => moveLeaf(-8)} aria-label="Di chuyển sang trái">
                ←
              </button>
              <button type="button" onClick={() => setIsPaused((value) => !value)} className={styles.pauseBtn}>
                {isPaused ? <Play size={17} /> : <Pause size={17} />}
                <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
              </button>
              <button type="button" onClick={() => moveLeaf(8)} aria-label="Di chuyển sang phải">
                →
              </button>
            </div>
            <p className={styles.keyboardHint}>Dùng phím ← → hoặc A D để di chuyển.</p>
          </section>

          <aside className={styles.sidePanel}>
            <div className={styles.infoCard}>
              <h2>Cách chơi</h2>
              <p>Di chuyển chiếc lá để đỡ giọt nước mắt đang rơi xuống.</p>
              <p>Đỡ đủ 10 giọt để tạo thành vườn hoa nhỏ.</p>
            </div>

            <div className={styles.gardenCard}>
              <h2>Vườn hoa của bạn</h2>
              <span>Mục tiêu: 10 bông hoa</span>
              <div className={styles.garden}>
                {gardenFlowers.map((flower) => (
                  <span
                    key={flower.id}
                    className={`${styles.gardenFlower} ${styles[flower.tone]}`}
                    style={{ left: `${flower.left}%`, animationDelay: flower.delay }}
                  />
                ))}
              </div>
            </div>

            <div className={styles.encourageCard}>
              <div className={styles.smallCloud}>•ᴗ•</div>
              <p>{isComplete ? 'Bạn đã gom đủ dịu dàng cho hôm nay.' : 'Không sao đâu, mình thử lại cùng bạn nhé.'}</p>
            </div>
          </aside>
        </main>

      </div>
    </Shell>
  );
}
