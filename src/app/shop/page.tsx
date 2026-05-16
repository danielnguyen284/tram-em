'use client';

import Shell from '@/components/layout/Shell';
import { formatVnd, shopCategories, shopProducts, type ShopProduct } from '@/data/shop';
import { useCartStore } from '@/store/useCartStore';
import { Heart, ShoppingBag, ShoppingCart, SlidersHorizontal, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './shop.module.css';

function ProductCard({ product }: { product: ShopProduct }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <article className={styles.productCard}>
      <Link href={`/shop/${product.slug}`} className={styles.imageLink} aria-label={`Xem ${product.name}`}>
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className={styles.productImage}
        />
        <span className={styles.favoriteBadge}>
          <Heart size={16} />
        </span>
      </Link>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span>{product.category}</span>
          <span className={styles.rating}>
            <Star size={14} fill="currentColor" />
            {product.rating}
          </span>
        </div>
        <Link href={`/shop/${product.slug}`} className={styles.productName}>
          {product.name}
        </Link>
        <p>{product.description}</p>

        <div className={styles.tags}>
          {product.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.priceGroup}>
            <strong>{formatVnd(product.price)}</strong>
            {product.oldPrice && <small>{formatVnd(product.oldPrice)}</small>}
          </div>
          <button type="button" onClick={() => addItem(product)} aria-label={`Thêm ${product.name} vào giỏ`}>
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState(shopCategories[0]);

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'Tất cả') return shopProducts;
    return shopProducts.filter((product) => product.category === activeCategory);
  }, [activeCategory]);

  return (
    <Shell>
      <section className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <span className={styles.kicker}>
              <ShoppingBag size={18} />
              Cửa hàng Trạm Êm
            </span>
            <h1>Những món nhỏ để căn phòng và tâm trí dịu lại</h1>
            <p>
              Chọn tinh dầu, nến thơm, sổ viết và những bộ thư giãn được phối theo nhịp sống chậm.
            </p>
          </div>
          <div className={styles.heroStats}>
            <strong>6</strong>
            <span>Sản phẩm demo</span>
          </div>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.toolbarTitle}>
            <SlidersHorizontal size={18} />
            <span>Lọc theo nhu cầu</span>
          </div>
          <div className={styles.filters} aria-label="Danh mục sản phẩm">
            {shopCategories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? styles.activeFilter : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </Shell>
  );
}
