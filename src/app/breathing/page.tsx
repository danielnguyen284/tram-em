'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Shell from '@/components/layout/Shell';
import { Play, Pause, RotateCcw, Wind, Moon, Square } from 'lucide-react';
import styles from './breathing.module.css';

const techniques = [
  { 
    id: '478',
    name: '4-7-8', 
    inhale: 4, hold1: 7, exhale: 8, hold2: 0, 
    description: 'Kỹ thuật cổ điển giúp giảm lo âu và dễ ngủ tức thì.',
    icon: Moon 
  },
  { 
    id: 'box',
    name: 'Box Breathing', 
    inhale: 4, hold1: 4, exhale: 4, hold2: 4, 
    description: 'Phương pháp của Navy SEAL, cân bằng hệ thần kinh hiệu quả.',
    icon: Square 
  },
  { 
    id: 'belly',
    name: 'Thở bụng', 
    inhale: 4, hold1: 0, exhale: 6, hold2: 0, 
    description: 'Thở cơ hoành tự nhiên, kích hoạt phản xạ thư giãn sâu.',
    icon: Wind 
  },
];

const cycleOptions = [2, 4, 6, 8];

export default function BreathingPage() {
  const [isActive, setIsActive] = useState(false);
  const [selectedTech, setSelectedTech] = useState(techniques[1]); // Default to Box Breathing
  const [cycles, setCycles] = useState(4);
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [timeLeft, setTimeLeft] = useState(selectedTech.inhale);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isActive) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Chuyển phase
            if (phase === 'inhale') {
              if (selectedTech.hold1 > 0) {
                setPhase('hold1');
                return selectedTech.hold1;
              } else {
                setPhase('exhale');
                return selectedTech.exhale;
              }
            } else if (phase === 'hold1') {
              setPhase('exhale');
              return selectedTech.exhale;
            } else if (phase === 'exhale') {
              if (selectedTech.hold2 > 0) {
                setPhase('hold2');
                return selectedTech.hold2;
              } else {
                setPhase('inhale');
                return selectedTech.inhale;
              }
            } else {
              setPhase('inhale');
              return selectedTech.inhale;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, phase, selectedTech]);

  const handleToggle = () => {
    if (!isActive) {
      setPhase('inhale');
      setTimeLeft(selectedTech.inhale);
    }
    setIsActive(!isActive);
  };

  const getPhaseText = () => {
    if (!isActive) return 'Sẵn sàng';
    switch (phase) {
      case 'inhale': return 'Hít vào';
      case 'hold1': return 'Giữ hơi';
      case 'exhale': return 'Thở ra';
      case 'hold2': return 'Giữ hơi';
      default: return 'Bắt đầu';
    }
  };

  return (
    <Shell>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Kiểm soát nhịp thở</h1>
          <p className={styles.subtitle}>
            Điều hòa hơi thở giúp hạ nhanh cortisol và khôi phục sự bình tĩnh.
          </p>
        </header>

        <main className={styles.mainLayout}>
          {/* Left Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.techniqueList}>
              {techniques.map((tech) => {
                const Icon = tech.icon;
                return (
                  <button
                    key={tech.id}
                    className={`${styles.techCard} ${selectedTech.id === tech.id ? styles.activeTechCard : ''}`}
                    onClick={() => {
                      setSelectedTech(tech);
                      setIsActive(false);
                      setPhase('inhale');
                      setTimeLeft(tech.inhale);
                    }}
                  >
                    <div className={styles.techIcon}>
                      <Icon size={24} />
                    </div>
                    <div className={styles.techInfo}>
                      <h4>{tech.name}</h4>
                      <p>{tech.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={styles.selectorGroup}>
              <span className={styles.selectorLabel}>Số chu kỳ</span>
              <div className={styles.selectorGrid}>
                {cycleOptions.map((opt) => (
                  <button
                    key={opt}
                    className={`${styles.optionBtn} ${cycles === opt ? styles.activeOption : ''}`}
                    onClick={() => setCycles(opt)}
                  >
                    {opt}x
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Center Visualizer */}
          <section className={styles.visualizerArea}>
            <div className={styles.circleWrapper}>
              <motion.div 
                className={styles.outerRing}
                animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className={styles.middleRing}
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              />
              
              <motion.div 
                className={styles.mainCircle}
                animate={{
                  scale: isActive 
                    ? (phase === 'inhale' ? 1.4 : phase === 'exhale' ? 0.8 : phase === 'hold1' ? 1.4 : 0.8)
                    : 1
                }}
                transition={{ 
                  duration: isActive 
                    ? (phase === 'inhale' ? selectedTech.inhale : 
                       phase === 'exhale' ? selectedTech.exhale : 
                       phase === 'hold1' ? selectedTech.hold1 : 
                       selectedTech.hold2)
                    : 2, 
                  ease: "easeInOut" 
                }}
              >
                <div className={styles.timerText}>{timeLeft}</div>
              </motion.div>
              
              <div className={styles.statusLabel}>
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={getPhaseText()}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={styles.statusText}
                  >
                    {getPhaseText()}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <div className={styles.actionArea}>
              <p className={styles.instruction}>
                Nhấn Bắt đầu và làm theo hướng dẫn của vòng tròn.
              </p>
              
              <button 
                className={`${styles.startBtn} ${isActive ? styles.stopBtn : ''}`}
                onClick={handleToggle}
              >
                {isActive ? <Pause size={24} /> : <Play size={24} />}
                <span>{isActive ? 'Tạm dừng' : 'Bắt đầu'}</span>
              </button>

              <div className={styles.phaseInfo}>
                <div className={`${styles.phaseTag} ${isActive && phase === 'inhale' ? styles.activePhaseTag : ''}`}>
                  Hít vào <span>{selectedTech.inhale}s</span>
                </div>
                {selectedTech.hold1 > 0 && (
                  <div className={`${styles.phaseTag} ${isActive && phase === 'hold1' ? styles.activePhaseTag : ''}`}>
                    Giữ <span>{selectedTech.hold1}s</span>
                  </div>
                )}
                <div className={`${styles.phaseTag} ${isActive && phase === 'exhale' ? styles.activePhaseTag : ''}`}>
                  Thở ra <span>{selectedTech.exhale}s</span>
                </div>
                {selectedTech.hold2 > 0 && (
                  <div className={`${styles.phaseTag} ${isActive && phase === 'hold2' ? styles.activePhaseTag : ''}`}>
                    Giữ <span>{selectedTech.hold2}s</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </Shell>
  );
}
