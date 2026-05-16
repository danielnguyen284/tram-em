'use client';

import { useState, useEffect } from 'react';
import LogoMark from '../layout/LogoMark';
import styles from './WelcomeScreens.module.css';
import { X } from 'lucide-react';
import Link from 'next/link';

const POPUP_MESSAGES = [
  { text: 'Hôm nay bạn đã mỉm cười chưa? Hãy dành 1 phút để thư giãn nhé! 😊', link: '/soundscape' },
  { text: 'Đôi khi điều tốt nhất bạn có thể làm là nghỉ ngơi. 🌿', link: '/breathing' },
  { text: 'Hãy hít một hơi thật sâu... và thở ra mọi muộn phiền. 🌬️', link: '/breathing' },
  { text: 'Bạn không cô đơn, luôn có người sẵn sàng lắng nghe. 💜', link: '/community' },
  { text: 'Ghé qua góc nhỏ của Omni để tâm tình nhé! 🤗', link: '/ai' },
];

export default function WelcomeScreens() {
  const [mounted, setMounted] = useState(false);
  const [splashVisible, setSplashVisible] = useState(false);
  const [splashHiding, setSplashHiding] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(POPUP_MESSAGES[0]);

  useEffect(() => {
    setMounted(true);
    setSplashVisible(true);

    // Ring animation takes 1.5s, then hold briefly before lifting
    const hideTimer = setTimeout(() => {
      setSplashHiding(true);
      setTimeout(() => setSplashVisible(false), 1200);
    }, 1800);

    const popupTimer = setTimeout(() => {
      const idx = Math.floor(Math.random() * POPUP_MESSAGES.length);
      setPopupContent(POPUP_MESSAGES[idx]);
      setShowPopup(true);
    }, 3000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(popupTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      {splashVisible && (
        <div className={`${styles.splashScreen} ${splashHiding ? styles.hiding : ''}`}>
          <div className={styles.splashContent}>
            {/* Logo with ring spinning around it */}
            <div className={styles.logoRing}>
              <LogoMark size={140} />
              <svg
                className={styles.ringSvg}
                viewBox="0 0 200 200"
                width="190"
                height="190"
                aria-hidden="true"
              >
                <circle
                  className={styles.ringCircle}
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className={styles.splashTitle}>Trạm Êm</h1>
            <p className={styles.splashSubtitle}>Ốc đảo chữa lành tâm hồn</p>
          </div>

          {/* Cloud-shaped bottom edge — fill */}
          <svg
            className={styles.cloudEdge}
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M0,0 L0,20 Q90,65 180,20 Q270,65 360,20 Q450,65 540,20 Q630,65 720,20 Q810,65 900,20 Q990,65 1080,20 Q1170,65 1260,20 Q1350,65 1440,20 L1440,0 Z" />
          </svg>

          {/* Cloud-shaped bottom edge — border stroke */}
          <svg
            className={styles.cloudEdgeBorder}
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M0,20 Q90,65 180,20 Q270,65 360,20 Q450,65 540,20 Q630,65 720,20 Q810,65 900,20 Q990,65 1080,20 Q1170,65 1260,20 Q1350,65 1440,20" />
          </svg>
        </div>
      )}

      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <button className={styles.closeBtn} onClick={() => setShowPopup(false)} aria-label="Đóng">
              <X size={20} />
            </button>
            <p className={styles.popupText}>{popupContent.text}</p>
            <Link href={popupContent.link} onClick={() => setShowPopup(false)} className={styles.popupLink}>
              Khám phá ngay
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
