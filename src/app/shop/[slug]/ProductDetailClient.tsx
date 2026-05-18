'use client';

import type { Product } from '@/types/database';
import { formatVnd } from '@/utils/format';
import { useCartStore } from '@/store/useCartStore';
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingCart, Star, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import styles from './product-detail.module.css';

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const decreaseQuantity = () => setQuantity((current) => Math.max(1, current - 1));
  const increaseQuantity = () => setQuantity((current) => Math.min(product.stock, current + 1));

  return (
    <section className={styles.page}>
      <Link href="/shop" className={styles.backLink}>
        <ArrowLeft size={18} />
        Quay lại cửa hàng
      </Link>

      <div className={styles.productLayout}>
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 48vw"
              className={styles.image}
            />
          </div>

          <div className={styles.thumbnails}>
            {product.images.map((image) => (
              <button
                type="button"
                key={image}
                className={selectedImage === image ? styles.activeThumbnail : ''}
                onClick={() => setSelectedImage(image)}
                aria-label={`Xem ảnh ${product.name}`}
              >
                <Image src={image} alt="" fill sizes="96px" className={styles.thumbnailImage} />
              </button>
            ))}
          </div>
        </div>

        <article className={styles.summary}>
          <div className={styles.categoryRow}>
            <span>{product.category}</span>
            <span className={styles.rating}>
              <Star size={16} fill="currentColor" />
              {product.rating}
            </span>
          </div>

          <h1>{product.name}</h1>
          <p className={styles.description}>{product.description}</p>

          <div className={styles.priceRow}>
            <strong>{formatVnd(product.price)}</strong>
            {product.old_price && <small>{formatVnd(product.old_price)}</small>}
          </div>

          <div className={styles.tags}>
            {product.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className={styles.quantityRow}>
            <span>Số lượng</span>
            <div className={styles.stepper}>
              <button type="button" onClick={decreaseQuantity} aria-label="Giảm số lượng">
                <Minus size={16} />
              </button>
              <strong>{quantity}</strong>
              <button type="button" onClick={increaseQuantity} aria-label="Tăng số lượng">
                <Plus size={16} />
              </button>
            </div>
            <small>Còn {product.stock} sản phẩm</small>
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={() => addItem({
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
              rating: product.rating,
            }, quantity)}
          >
            <ShoppingCart size={20} />
            Thêm vào giỏ hàng
          </button>

          <div className={styles.benefits}>
            <div>
              <Truck size={20} />
              <span>Giao hàng trong 2-3 ngày</span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>Đổi trả nếu sản phẩm lỗi</span>
            </div>
          </div>
        </article>
      </div>

      <section className={styles.detailSection}>
        <h2>Chi tiết sản phẩm</h2>
        <div className={styles.detailGrid}>
          {product.details.map((detail) => (
            <div key={detail} className={styles.detailItem}>
              <span />
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
