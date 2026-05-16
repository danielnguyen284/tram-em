'use client';

import Shell from '@/components/layout/Shell';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import styles from './games.module.css';

const categories = ['Tất cả', 'Vui nhộn', 'Thư giãn', 'Sáng tạo'];

const games = [
  {
    id: 'balloon-pop',
    title: 'Bóp bóng bay',
    description: 'Bóp từng quả bóng, thả lỏng căng thẳng theo từng tiếng pop nhẹ nhàng',
    category: 'Vui nhộn',
    image: '/images/game-balloon-pop.png',
    href: '/games/balloon-pop',
  },
  {
    id: 'sand-draw',
    title: 'Vẽ trên cát',
    description: 'Vẽ tự do trên cát ấm, nghe tiếng xào xạo và để tâm trí bay bổng',
    category: 'Sáng tạo',
    image: '/images/game-sand-draw.png',
    href: '/games/sand-draw',
  },
  {
    id: 'pebble-sort',
    title: 'Sắp xếp sỏi',
    description: 'Đổi vị trí những viên sỏi màu, thiền theo nhịp chuyển động nhẹ nhàng',
    category: 'Thư giãn',
    image: '/images/game-pebble-sort.png',
    href: '/games/pebble-sort',
  },
];

export default function GamesPage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const filtered = games.filter(
    g => activeCategory === 'Tất cả' || g.category === activeCategory
  );

  return (
    <Shell>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Mini game giảm stress</h1>
          <p className={styles.subtitle}>Những trò chơi nhỏ giúp bạn thư giãn và giải tỏa áp lực</p>
        </div>

        <div className={styles.filters}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map(game => (
            <Link key={game.id} href={game.href} className={styles.card}>
              <div className={styles.thumbnail}>
                <Image
                  src={game.image}
                  alt={game.title}
                  fill
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
