'use client';

import { useRef, useState, useTransition } from 'react';
import type { Product, ProductCategory } from '@/types/database';
import { saveProduct, deleteProduct } from '@/app/admin/actions';
import { formatVnd } from '@/utils/format';
import { Eye, Plus, Edit2, Trash2, X } from 'lucide-react';
import styles from '../../admin.module.css';

type Props = {
  initialProducts: Product[];
  activeCategories: ProductCategory[];
};

function listFromLines(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listFromComma(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberFromForm(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ProductsClient({ initialProducts, activeCategories }: Props) {
  const products = initialProducts;
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleAddClick = () => {
    setEditingProduct(null);
    setImages([]);
    setPreviewProduct(null);
    setIsOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setImages(product.images ?? []);
    setPreviewProduct(null);
    setIsOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    startTransition(async () => {
      await deleteProduct(id);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            newImages.push(data.url);
          }
        } else {
          const data = await res.json();
          alert(`Lỗi upload ảnh "${file.name}": ${data.error || 'Thử lại sau.'}`);
        }
      }
      setImages(newImages);
    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi khi tải ảnh lên.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (images.length === 0) {
      alert('Vui lòng tải lên ít nhất một hình ảnh cho sản phẩm.');
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      if (editingProduct) {
        formData.set('id', editingProduct.id);
      }
      formData.set('images', images.join('\n'));
      await saveProduct(formData);
      setIsOpen(false);
    });
  };

  const handlePreviewClick = () => {
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const categoryId = String(formData.get('category_id') ?? '');
    const category = activeCategories.find((item) => item.id === categoryId);
    const name = String(formData.get('name') ?? '').trim() || 'Tên sản phẩm';

    setPreviewProduct({
      id: editingProduct?.id ?? 'preview',
      slug: String(formData.get('slug') ?? '').trim() || 'san-pham-moi',
      name,
      category_id: category?.id ?? null,
      category: category?.name ?? 'Danh mục',
      price: numberFromForm(formData.get('price')),
      old_price: String(formData.get('old_price') ?? '').trim() ? numberFromForm(formData.get('old_price')) : null,
      description: String(formData.get('description') ?? '').trim() || 'Mô tả ngắn của sản phẩm sẽ hiển thị ở đây.',
      details: listFromLines(formData.get('details')),
      detail_story: String(formData.get('detail_story') ?? '').trim() || null,
      usage_tips: listFromLines(formData.get('usage_tips')),
      suitable_for: listFromLines(formData.get('suitable_for')),
      shipping_note: String(formData.get('shipping_note') ?? '').trim() || null,
      return_note: String(formData.get('return_note') ?? '').trim() || null,
      quality_note: String(formData.get('quality_note') ?? '').trim() || null,
      images,
      tags: listFromComma(formData.get('tags')),
      stock: numberFromForm(formData.get('stock')),
      sales_count: editingProduct?.sales_count ?? 0,
      is_active: formData.get('is_active') === 'on',
      created_at: editingProduct?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1>Quản lý sản phẩm</h1>
          <p>Quản lý danh sách sản phẩm, giá bán, mô tả, tồn kho và hình ảnh của cửa hàng.</p>
        </div>
        <button 
          onClick={handleAddClick} 
          className={styles.button}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          Thêm sản phẩm
        </button>
      </header>

      <section className={styles.panel} style={{ marginTop: '20px' }}>
        <div className={styles.panelHeader}>
          <h2>Sản phẩm</h2>
          <span className={styles.muted}>{products.length} mục</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Danh mục</th>
              <th>Giá bán</th>
              <th>Giá cũ</th>
              <th>Tồn</th>
              <th>Đã bán</th>
              <th>Trạng thái</th>
              <th style={{ width: '120px' }}></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#75667e' }}>
                  Chưa có sản phẩm nào.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                </td>
                <td>
                  <span className={styles.muted} style={{ fontSize: '13px' }}>
                    {product.category || 'Không xác định'}
                  </span>
                </td>
                <td>
                  <strong>{formatVnd(product.price)}</strong>
                </td>
                <td>
                  {product.old_price ? (
                    <span style={{ textDecoration: 'line-through', color: '#8a7a94', fontSize: '13px' }}>
                      {formatVnd(product.old_price)}
                    </span>
                  ) : (
                    <span className={styles.muted}>-</span>
                  )}
                </td>
                <td>
                  <span className={styles.orderCode}>{product.stock}</span>
                </td>
                <td>
                  <span style={{ color: '#8e6c9f', background: '#f3ebf5', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 800 }}>
                    {product.sales_count || 0}
                  </span>
                </td>
                <td>
                  <span className={`${styles.status} ${!product.is_active ? styles.statusOff : ''}`}>
                    {product.is_active ? 'Đang bán' : 'Đã ẩn'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleEditClick(product)} 
                      className={styles.ghostButton}
                      style={{ padding: '6px', minHeight: '30px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(product.id, product.name)} 
                      className={styles.dangerButton}
                      style={{ padding: '6px', minHeight: '30px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Modal Dialog */}
      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '760px' }}>
            <div className={styles.modalHeader}>
              <h3>{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
              <button onClick={() => setIsOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            
            <form ref={formRef} onSubmit={handleFormSubmit}>
              <div className={styles.modalBody} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Tên sản phẩm
                    <input 
                      name="name" 
                      required 
                      defaultValue={editingProduct?.name ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>
                  
                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Đường dẫn thân thiện (Slug)
                    <input 
                      name="slug" 
                      placeholder="tự tạo nếu bỏ trống" 
                      defaultValue={editingProduct?.slug ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Danh mục
                    <select 
                      name="category_id" 
                      required 
                      defaultValue={editingProduct?.category_id ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px', minHeight: '38px' }}
                    >
                      <option value="" disabled>Chọn danh mục</option>
                      {activeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Tồn kho
                    <input 
                      name="stock" 
                      type="number" 
                      required
                      defaultValue={editingProduct?.stock ?? 0} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Giá bán (VND)
                    <input 
                      name="price" 
                      type="number" 
                      required
                      defaultValue={editingProduct?.price ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Giá cũ / Chưa giảm (VND)
                    <input 
                      name="old_price" 
                      type="number" 
                      placeholder="bỏ trống nếu không giảm giá" 
                      defaultValue={editingProduct?.old_price ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, gridColumn: 'span 2' }}>
                    Tags (phân cách bằng dấu phẩy)
                    <input 
                      name="tags" 
                      placeholder="ngủ ngon, dịu nhẹ, thư giãn" 
                      defaultValue={editingProduct?.tags?.join(', ') ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, gridColumn: 'span 2' }}>
                    Mô tả sản phẩm
                    <textarea 
                      name="description" 
                      required
                      rows={4}
                      defaultValue={editingProduct?.description ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '10px 12px', minHeight: '80px', resize: 'vertical' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, gridColumn: 'span 2' }}>
                    Chi tiết kỹ thuật / Điểm nổi bật (mỗi dòng một mục)
                    <textarea 
                      name="details" 
                      rows={3}
                      placeholder="Sáp ong tự nhiên&#10;Bấc gỗ không khói"
                      defaultValue={editingProduct?.details?.join('\n') ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '10px 12px', minHeight: '60px', resize: 'vertical' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, gridColumn: 'span 2' }}>
                    Vì sao món này đáng có
                    <textarea 
                      name="detail_story" 
                      rows={4}
                      placeholder="Viết đoạn mô tả đầy đủ hơn để hiển thị ở trang chi tiết..."
                      defaultValue={editingProduct?.detail_story ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '10px 12px', minHeight: '90px', resize: 'vertical' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, gridColumn: 'span 2' }}>
                    Cách dùng gợi ý (mỗi dòng một mục)
                    <textarea 
                      name="usage_tips" 
                      rows={3}
                      placeholder="Nhỏ 3-5 giọt vào máy khuếch tán...&#10;Dùng vào buổi tối trước khi ngủ..."
                      defaultValue={editingProduct?.usage_tips?.join('\n') ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '10px 12px', minHeight: '80px', resize: 'vertical' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, gridColumn: 'span 2' }}>
                    Phù hợp với (mỗi dòng một mục)
                    <textarea 
                      name="suitable_for" 
                      rows={3}
                      placeholder="Người muốn thư giãn trước khi ngủ&#10;Người thích mùi hương dịu nhẹ"
                      defaultValue={editingProduct?.suitable_for?.join('\n') ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '10px 12px', minHeight: '80px', resize: 'vertical' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, gridColumn: 'span 2' }}>
                    Ghi chú giao hàng
                    <textarea 
                      name="shipping_note" 
                      rows={2}
                      defaultValue={editingProduct?.shipping_note ?? ''} 
                      placeholder="Đóng gói chắc chắn, giao trong 2-3 ngày..."
                      className={styles.inlineSelect}
                      style={{ padding: '10px 12px', minHeight: '60px', resize: 'vertical' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Ghi chú đổi trả
                    <textarea 
                      name="return_note" 
                      rows={2}
                      defaultValue={editingProduct?.return_note ?? ''} 
                      placeholder="Đổi trả nếu sản phẩm lỗi..."
                      className={styles.inlineSelect}
                      style={{ padding: '10px 12px', minHeight: '60px', resize: 'vertical' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Ghi chú kiểm tra chất lượng
                    <textarea 
                      name="quality_note" 
                      rows={2}
                      defaultValue={editingProduct?.quality_note ?? ''} 
                      placeholder="Kiểm tra số lượng và tình trạng trước khi gửi..."
                      className={styles.inlineSelect}
                      style={{ padding: '10px 12px', minHeight: '60px', resize: 'vertical' }}
                    />
                  </label>

                  <div style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, gridColumn: 'span 2' }}>
                    <span>Hình ảnh sản phẩm (Upload tự động lên ImgBB)</span>
                    <input type="hidden" name="images" value={images.join('\n')} />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', marginTop: '6px' }}>
                      {images.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ece3ee' }}>
                          <img src={url} alt={`Product image ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255, 240, 243, 0.9)', border: 'none', borderRadius: '50%', color: '#a33c5c', width: '20px', height: '20px', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      
                      <label style={{ width: '80px', height: '80px', border: '2px dashed #ece3ee', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: isUploading ? 'not-allowed' : 'pointer', color: '#8a7a94', transition: 'border-color 0.15s', opacity: isUploading ? 0.6 : 1 }}>
                        <Plus size={20} />
                        <span style={{ fontSize: '10px', marginTop: '4px' }}>{isUploading ? 'Đang tải...' : 'Tải ảnh'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={handleImageUpload} 
                          disabled={isUploading}
                          style={{ display: 'none' }} 
                        />
                      </label>
                    </div>
                    {images.length === 0 && (
                      <span style={{ color: '#a33c5c', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>
                        * Vui lòng tải lên ít nhất một ảnh sản phẩm.
                      </span>
                    )}
                  </div>

                  <label className={styles.checkbox} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5f5069', fontSize: '13px', fontWeight: 800, cursor: 'pointer', gridColumn: 'span 2', marginTop: '4px' }}>
                    <input 
                      name="is_active" 
                      type="checkbox" 
                      defaultChecked={editingProduct ? editingProduct.is_active : true} 
                    />
                    Cho phép hiển thị và bán sản phẩm này
                  </label>
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={handlePreviewClick} 
                  className={styles.ghostButton}
                  disabled={isUploading}
                  style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Eye size={15} />
                  Xem trước
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className={styles.ghostButton}
                  disabled={isPending || isUploading}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className={styles.button}
                  disabled={isPending || isUploading}
                >
                  {isPending ? 'Đang lưu...' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '920px' }}>
            <div className={styles.modalHeader}>
              <h3>Xem trước sản phẩm</h3>
              <button onClick={() => setPreviewProduct(null)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody} style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.75fr) minmax(0, 1fr)', gap: '18px' }}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: '10px', background: '#f6f0fa' }}>
                    {previewProduct.images[0] ? (
                      <img src={previewProduct.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#8a7a94', fontWeight: 800 }}>
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {previewProduct.tags.map((tag) => (
                      <span key={tag} style={{ padding: '4px 8px', borderRadius: '999px', background: '#f6f0fa', color: '#6e4c98', fontSize: '11px', fontWeight: 900 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '14px' }}>
                  <div>
                    <p style={{ color: '#8a7a94', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                      {previewProduct.category}
                    </p>
                    <h2 style={{ marginTop: '6px', color: '#2f2638', fontSize: '30px', lineHeight: 1.15 }}>
                      {previewProduct.name}
                    </h2>
                    <p style={{ marginTop: '10px', color: '#5f5069', lineHeight: 1.6, fontWeight: 700 }}>
                      {previewProduct.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '12px' }}>
                      <strong style={{ color: '#2f2638', fontSize: '24px' }}>{formatVnd(previewProduct.price)}</strong>
                      {previewProduct.old_price && (
                        <small style={{ color: '#8a7a94', textDecoration: 'line-through', fontWeight: 800 }}>
                          {formatVnd(previewProduct.old_price)}
                        </small>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <PreviewBlock title="Vì sao món này đáng có" items={[previewProduct.detail_story || previewProduct.description]} />
                    <PreviewBlock title="Thông số nổi bật" items={previewProduct.details} />
                    <PreviewBlock title="Cách dùng gợi ý" items={previewProduct.usage_tips} />
                    <PreviewBlock title="Phù hợp với" items={previewProduct.suitable_for} />
                    <PreviewBlock
                      title="Ghi chú dịch vụ"
                      items={[previewProduct.shipping_note, previewProduct.return_note, previewProduct.quality_note].filter(Boolean) as string[]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" onClick={() => setPreviewProduct(null)} className={styles.button}>
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PreviewBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: '12px', border: '1px solid #ece3ee', borderRadius: '10px', background: '#fbf8fc' }}>
      <h4 style={{ marginBottom: '8px', color: '#2f2638', fontSize: '14px' }}>{title}</h4>
      <div style={{ display: 'grid', gap: '6px' }}>
        {items.map((item) => (
          <p key={item} style={{ color: '#5f5069', fontSize: '13px', fontWeight: 700, lineHeight: 1.55 }}>
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}
