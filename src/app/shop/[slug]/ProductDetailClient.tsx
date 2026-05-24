'use client';

import type { Product } from '@/types/database';
import { formatVnd } from '@/utils/format';
import { useCartStore } from '@/store/useCartStore';
import { animateFlyToCart } from '@/utils/animations';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Minus, PackageCheck, Plus, ShieldCheck, ShoppingCart, Sparkles, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './product-detail.module.css';

export default function ProductDetailClient({ product, relatedProducts }: { product: Product; relatedProducts: Product[] }) {
  const [selectedImageUrl, setSelectedImageUrl] = useState(product.images[0] ?? '');
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const visibleImages = useMemo(
    () => product.images.filter((image) => image && !failedImages.has(image)),
    [failedImages, product.images],
  );
  const selectedImageIndex = Math.max(0, visibleImages.indexOf(selectedImageUrl));
  const selectedImage = visibleImages[selectedImageIndex] ?? visibleImages[0] ?? '/images/logo.png';
  const isOutOfStock = product.stock <= 0;
  const [quantity, setQuantity] = useState(isOutOfStock ? 0 : 1);
  const addItem = useCartStore((state) => state.addItem);
  const usageTips = product.usage_tips.length > 0 ? product.usage_tips : [];
  const fitNotes = product.suitable_for.length > 0 ? product.suitable_for : [];
  const detailStory = product.detail_story?.trim() || product.description;
  const shippingNote = product.shipping_note?.trim() || 'Giao hàng trong 2-3 ngày.';
  const returnNote = product.return_note?.trim() || 'Đổi trả nếu sản phẩm lỗi.';
  const qualityNote = product.quality_note?.trim() || 'Kiểm tra sản phẩm trước khi gửi.';
  const canSlide = visibleImages.length > 1;

  useEffect(() => {
    if (!canSlide) return;

    const timer = window.setInterval(() => {
      setSelectedImageUrl((current) => {
        const currentIndex = Math.max(0, visibleImages.indexOf(current));
        return visibleImages[(currentIndex + 1) % visibleImages.length];
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [canSlide, visibleImages]);

  const markImageFailed = (image: string) => {
    setFailedImages((current) => {
      const next = new Set(current);
      next.add(image);
      return next;
    });
  };

  const showPreviousImage = () => {
    if (!canSlide) return;
    setSelectedImageUrl((current) => {
      const currentIndex = Math.max(0, visibleImages.indexOf(current));
      return visibleImages[(currentIndex - 1 + visibleImages.length) % visibleImages.length];
    });
  };

  const showNextImage = () => {
    if (!canSlide) return;
    setSelectedImageUrl((current) => {
      const currentIndex = Math.max(0, visibleImages.indexOf(current));
      return visibleImages[(currentIndex + 1) % visibleImages.length];
    });
  };

  const decreaseQuantity = () => setQuantity((current) => Math.max(isOutOfStock ? 0 : 1, current - 1));
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
              key={selectedImage}
              src={selectedImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 48vw"
              className={styles.image}
              onError={() => markImageFailed(selectedImage)}
            />
            {canSlide && (
              <>
                <button
                  type="button"
                  className={`${styles.galleryNav} ${styles.galleryNavPrev}`}
                  onClick={showPreviousImage}
                  aria-label="Xem ảnh trước"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  className={`${styles.galleryNav} ${styles.galleryNavNext}`}
                  onClick={showNextImage}
                  aria-label="Xem ảnh tiếp theo"
                >
                  <ChevronRight size={22} />
                </button>
                <div className={styles.galleryDots} aria-label="Vị trí ảnh hiện tại">
                  {visibleImages.map((image, index) => (
                    <button
                      type="button"
                      key={image}
                      className={index === selectedImageIndex ? styles.activeDot : ''}
                      onClick={() => setSelectedImageUrl(image)}
                      aria-label={`Xem ảnh ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

        </div>

        <article className={styles.summary}>
          <div className={styles.categoryRow}>
            <span>{product.category}</span>
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
            <div className={styles.stepper} style={isOutOfStock ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
              <button type="button" onClick={decreaseQuantity} disabled={isOutOfStock} aria-label="Giảm số lượng">
                <Minus size={16} />
              </button>
              <strong>{quantity}</strong>
              <button type="button" onClick={increaseQuantity} disabled={isOutOfStock} aria-label="Tăng số lượng">
                <Plus size={16} />
              </button>
            </div>
            {isOutOfStock ? (
              <small style={{ color: '#dc2626', fontWeight: 900 }}>Đã hết hàng • Đã bán {product.sales_count || 0}</small>
            ) : (
              <small>Còn {product.stock} sản phẩm • Đã bán {product.sales_count || 0}</small>
            )}
          </div>

          <button
            type="button"
            className={styles.addButton}
            disabled={isOutOfStock}
            onClick={(e) => {
              if (isOutOfStock) return;
              const section = e.currentTarget.closest('section');
              const img = section?.querySelector('img') as HTMLImageElement;
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
              }, quantity);
            }}
            style={isOutOfStock ? { background: '#eae2ec', color: '#8a7a94', cursor: 'not-allowed', boxShadow: 'none', transform: 'none' } : undefined}
          >
            <ShoppingCart size={20} />
            {isOutOfStock ? 'Sản phẩm đã hết hàng' : 'Thêm vào giỏ hàng'}
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

          {(usageTips[0] || fitNotes[0]) && (
            <div className={styles.summaryGuides}>
              {usageTips[0] && (
                <div>
                  <Sparkles size={18} />
                  <span>Gợi ý dùng</span>
                  <p>{usageTips[0]}</p>
                </div>
              )}
              {fitNotes[0] && (
                <div>
                  <Heart size={18} />
                  <span>Phù hợp với</span>
                  <p>{fitNotes[0]}</p>
                </div>
              )}
            </div>
          )}
        </article>
      </div>

      <section className={styles.detailSection}>
        <div className={styles.sectionHeader}>
          <span>Thông tin sản phẩm</span>
          <h2>Chi tiết để bạn chọn đúng nhu cầu</h2>
        </div>
        <div className={styles.detailContent}>
          <div className={styles.storyBlock}>
            <h3>Vì sao món này đáng có</h3>
            <p>{detailStory}</p>
          </div>

          {product.details.length > 0 && (
            <div className={styles.infoBlock}>
              <h3>Thông số nổi bật</h3>
              <div className={styles.detailGrid}>
                {product.details.map((detail) => (
                  <div key={detail} className={styles.detailItem}>
                    <span />
                    <p>{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {usageTips.length > 0 && (
            <div className={styles.infoBlock}>
              <h3>Cách dùng gợi ý</h3>
              <div className={styles.noteList}>
                {usageTips.map((tip) => (
                  <p key={tip}>{tip}</p>
                ))}
              </div>
            </div>
          )}

          {fitNotes.length > 0 && (
            <div className={styles.infoBlock}>
              <h3>Phù hợp với</h3>
              <div className={styles.noteList}>
                {fitNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={styles.serviceSection}>
        <div className={styles.serviceItem}>
          <Truck size={22} />
          <div>
            <h3>Giao hàng 2-3 ngày</h3>
            <p>{shippingNote}</p>
          </div>
        </div>
        <div className={styles.serviceItem}>
          <ShieldCheck size={22} />
          <div>
            <h3>Đổi trả khi có lỗi</h3>
            <p>{returnNote}</p>
          </div>
        </div>
        <div className={styles.serviceItem}>
          <PackageCheck size={22} />
          <div>
            <h3>Kiểm tra trước khi gửi</h3>
            <p>{qualityNote}</p>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.sectionHeader}>
            <span>Cùng danh mục</span>
            <h2>Có thể bạn cũng thích</h2>
          </div>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/shop/${item.slug}`} className={styles.relatedCard}>
                <div className={styles.relatedImage}>
                  <Image src={item.images[0]} alt={item.name} fill sizes="(max-width: 760px) 100vw, 30vw" />
                </div>
                <span>{item.category}</span>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                <small>{formatVnd(item.price)}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
