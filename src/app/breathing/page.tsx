'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Shell from '@/components/layout/Shell';
import Button from '@/components/ui/Button';
import { Play, Pause, RotateCcw, Wind } from 'lucide-react';
import styles from './breathing.module.css';

const techniques = [
  { name: '4-4-4-4 (Hộp)', inhale: 4, hold1: 4, exhale: 4, hold2: 4, description: 'Giúp lấy lại sự tập trung và tỉnh táo.' },
  { name: '4-7-8 (Thư giãn)', inhale: 4, hold1: 7, exhale: 8, hold2: 0, description: 'Kỹ thuật kinh điển giúp đi vào giấc ngủ nhanh hơn.' },
  { name: '5-5 (Cân bằng)', inhale: 5, hold1: 0, exhale: 5, hold2: 0, description: 'Điều hòa nhịp tim và ổn định cảm xúc.' },
];

export default function BreathingPage() {
  const [isActive, setIsActive] = useState(false);
  const [selectedTech, setSelectedTech] = useState(techniques[0]);
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

  const reset = () => {
    setIsActive(false);
    setPhase('inhale');
    setTimeLeft(selectedTech.inhale);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Hít vào...';
      case 'hold1': return 'Giữ hơi...';
      case 'exhale': return 'Thở ra...';
      case 'hold2': return 'Nín thở...';
    }
  };

  return (
    <Shell>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className="text-h1">Nhịp thở Chữa lành</h2>
          <p className="muted">Điều hòa hơi thở là cách nhanh nhất để xoa dịu hệ thần kinh.</p>
        </div>

        <div className={styles.visualizerArea}>
          <div className={styles.circleContainer}>
            {/* Hiệu ứng hào quang */}
            <motion.div 
              className={styles.glow}
              animate={{
                scale: phase === 'inhale' ? 1.5 : phase === 'exhale' ? 1 : phase === 'hold1' ? 1.5 : 1,
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: phase === 'inhale' ? selectedTech.inhale : selectedTech.exhale, ease: "linear" }}
            />
            
            {/* Vòng tròn chính */}
            <motion.div 
              className={styles.mainCircle}
              animate={{
                scale: phase === 'inhale' ? 1.4 : phase === 'exhale' ? 0.8 : phase === 'hold1' ? 1.4 : 0.8,
              }}
              transition={{ 
                duration: phase === 'inhale' ? selectedTech.inhale : 
                          phase === 'exhale' ? selectedTech.exhale : 
                          phase === 'hold1' ? selectedTech.hold1 : 
                          selectedTech.hold2, 
                ease: "easeInOut" 
              }}
            >
              <div className={styles.timer}>{timeLeft}</div>
            </motion.div>

            <div className={styles.phaseLabel}>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.statusText}
                >
                  {getPhaseText()}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.techTabs}>
            {techniques.map(t => (
              <button 
                key={t.name}
                className={`${styles.tab} ${selectedTech.name === t.name ? styles.activeTab : ''}`}
                onClick={() => {
                  setSelectedTech(t);
                  setIsActive(false);
                  setTimeLeft(t.inhale);
                  setPhase('inhale');
                }}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className={styles.actionBtns}>
            <Button onClick={handleToggle} variant="primary" size="lg" className={styles.mainBtn}>
              {isActive ? <Pause size={24} /> : <Play size={24} />}
              <span>{isActive ? 'Tạm dừng' : 'Bắt đầu'}</span>
            </Button>
            <Button onClick={reset} variant="outline" size="lg">
              <RotateCcw size={24} />
            </Button>
          </div>

          <p className={styles.description}>{selectedTech.description}</p>
        </div>
      </div>
    </Shell>
  );
}
