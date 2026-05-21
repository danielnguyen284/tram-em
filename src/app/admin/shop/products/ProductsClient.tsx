'use client';

import { useState, useTransition, useMemo } from 'react';
import type { Product, ProductCategory } from '@/types/database';
import { saveProduct, deleteProduct } from '@/app/admin/actions';
import { formatVnd } from '@/utils/format';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import styles from '../../admin.module.css';

type Props = {
  initialProducts: Product[];
  activeCategories: ProductCategory[];
};

export default function ProductsClient({ initialProducts, activeCategories }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sync state if initialProducts changes
  useMemo(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleAddClick = () => {
    setEditingProduct(null);
    setImages([]);
    setIsOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setImages(product.images ?? []);
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
          <div className={styles.modalContent} style={{ maxWidth: '640px' }}>
            <div className={styles.modalHeader}>
              <h3>{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
              <button onClick={() => setIsOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
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
    </>
  );
}
