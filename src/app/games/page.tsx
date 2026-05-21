'use client';

import Shell from '@/components/layout/Shell';
import { gameCategories, games } from '@/data/games';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import styles from './games.module.css';

export default function GamesPage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const filtered = games.filter(
    (game) => activeCategory === 'Tất cả' || game.category === activeCategory,
  );

  return (
    <Shell>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Mini game giảm stress</h1>
          <p className={styles.subtitle}>Những trò chơi nhỏ giúp bạn thư giãn và giải tỏa áp lực</p>
        </div>

        <div className={styles.filters}>
          {gameCategories.map((category) => (
            <button
              key={category}
              className={`${styles.filterBtn} ${activeCategory === category ? styles.active : ''}`}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map((game) => (
            <Link key={game.id} href={game.href} className={styles.card}>
              <div className={styles.thumbnail}>
                <Image
                  src={game.image}
                  alt={game.title}
                  fill
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 320px"
                  className={styles.thumbImg}
                />
                <div className={styles.playOverlay}>
                  <span className={styles.playIcon}>▶</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{game.title}</h3>
                <p className={styles.cardDesc}>{game.description}</p>
                <span className={styles.cardTag}>{game.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
