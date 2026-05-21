'use client';

import type { Product } from '@/types/database';
import { formatVnd } from '@/utils/format';
import { useCartStore } from '@/store/useCartStore';
import { animateFlyToCart } from '@/utils/animations';
import { Heart, ShoppingBag, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './shop.module.css';

function ProductCard({ product }: { product: Product }) {
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
        <div className={styles.cardMeta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>{product.category}</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {product.stock <= 0 ? (
              <span style={{ color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>Hết hàng</span>
            ) : (
              <span style={{ color: '#8e6c9f', background: '#f3ebf5', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>Đã bán {product.sales_count || 0}</span>
            )}
          </div>
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
            {product.old_price && <small>{formatVnd(product.old_price)}</small>}
          </div>
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={(e) => {
              if (product.stock <= 0) return;
              const card = e.currentTarget.closest('article');
              const img = card?.querySelector('img') as HTMLImageElement;
              animateFlyToCart(img);
              
              addItem({
                id: product.id,
                slug: product.slug,
                name: product.name,
                category: product.category,
                price: product.price,
                oldPrice: product.old_price ?? undefined,
                description: product.description,
                details: product.details,
                images: product.images,
                tags: product.tags,
                stock: product.stock,
              });
            }}
            style={product.stock <= 0 ? { background: '#eae2ec', color: '#8a7a94', cursor: 'not-allowed', width: 'auto', padding: '0 12px', fontSize: '12px', fontWeight: 700 } : undefined}
            aria-label={product.stock <= 0 ? 'Hết hàng' : `Thêm ${product.name} vào giỏ`}
          >
            {product.stock <= 0 ? 'Hết hàng' : <ShoppingCart size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}

type Props = {
  products: Product[];
  categories: string[];
};

export default function ShopClient({ products, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? 'Tất cả');

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'Tất cả') return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  return (
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
          <strong>{products.length}</strong>
          <span>Sản phẩm</span>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <SlidersHorizontal size={18} />
          <span>Lọc theo nhu cầu</span>
        </div>
        <div className={styles.filters} aria-label="Danh mục sản phẩm">
          {categories.map((category) => (
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
  );
}
