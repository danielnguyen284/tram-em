'use client';

import { useState, useTransition, useMemo } from 'react';
import type { ProductCategory } from '@/types/database';
import {
  saveProductCategory,
  deleteProductCategory,
  updateCategorySortOrders,
} from '@/app/admin/actions';
import { GripVertical, Plus, Edit2, Trash2, X } from 'lucide-react';
import styles from '../../admin.module.css';

type Props = {
  initialCategories: ProductCategory[];
};

export default function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const [isPending, startTransition] = useTransition();

  // Sync state if initialCategories changes (RSC page update)
  useMemo(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Open modal for adding
  const handleAddClick = () => {
    setEditingCategory(null);
    setIsOpen(true);
  };

  // Open modal for editing
  const handleEditClick = (category: ProductCategory) => {
    setEditingCategory(category);
    setIsOpen(true);
  };

  // Handle delete
  const handleDeleteClick = (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"? Tất cả sản phẩm trong danh mục này sẽ bị ảnh hưởng.`)) {
      return;
    }
    
    startTransition(async () => {
      await deleteProductCategory(id);
    });
  };

  // Modal Form Submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      if (editingCategory) {
        formData.set('id', editingCategory.id);
        formData.set('sort_order', String(editingCategory.sort_order));
      } else {
        // Find maximum sort order or fallback to categories length
        const maxSort = categories.reduce((max, cat) => Math.max(max, cat.sort_order), 0);
        formData.set('sort_order', String(maxSort + 1));
      }
      
      await saveProductCategory(formData);
      setIsOpen(false);
    });
  };

  // HTML5 Drag & Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const list = [...categories];
    const draggedItem = list[draggedIndex];
    
    // Move item
    list.splice(draggedIndex, 1);
    list.splice(index, 0, draggedItem);

    // Re-assign sort orders sequentially
    const updatedList = list.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setCategories(updatedList);

    startTransition(async () => {
      const orders = updatedList.map((item) => ({ id: item.id, sort_order: item.sort_order }));
      await updateCategorySortOrders(orders);
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1>Quản lý danh mục</h1>
          <p>Quản lý danh mục sản phẩm của cửa hàng. Kéo thả để sắp xếp thứ tự.</p>
        </div>
        <button 
          onClick={handleAddClick} 
          className={styles.button}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          Thêm danh mục
        </button>
      </header>

      <section className={styles.panel} style={{ marginTop: '20px' }}>
        <div className={styles.panelHeader}>
          <h2>Danh mục sản phẩm</h2>
          <span className={styles.muted}>{categories.length} mục</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Tên</th>
              <th>Slug</th>
              <th>Thứ tự</th>
              <th>Trạng thái</th>
              <th style={{ width: '120px' }}></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#75667e' }}>
                  Chưa có danh mục nào.
                </td>
              </tr>
            )}
            {categories.map((category, index) => {
              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index;
              
              return (
                <tr 
                  key={category.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`${styles.draggableRow} ${isDragging ? styles.draggableRowDragging : ''} ${isOver ? styles.draggableRowOver : ''}`}
                >
                  <td>
                    <span className={styles.dragHandle}>
                      <GripVertical size={16} />
                    </span>
                  </td>
                  <td>
                    <strong>{category.name}</strong>
                  </td>
                  <td>{category.slug}</td>
                  <td>
                    <span className={styles.orderCode}>{category.sort_order}</span>
                  </td>
                  <td>
                    <span className={`${styles.status} ${!category.is_active ? styles.statusOff : ''}`}>
                      {category.is_active ? 'Đang hiện' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleEditClick(category)} 
                        className={styles.ghostButton}
                        style={{ padding: '6px', minHeight: '30px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(category.id, category.name)} 
                        className={styles.dangerButton}
                        style={{ padding: '6px', minHeight: '30px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Modal Dialog */}
      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</h3>
              <button onClick={() => setIsOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className={styles.modalBody}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Tên danh mục
                    <input 
                      name="name" 
                      required 
                      defaultValue={editingCategory?.name ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Slug
                    <input 
                      name="slug" 
                      placeholder="tự tạo nếu bỏ trống" 
                      defaultValue={editingCategory?.slug ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>
                  <label className={styles.checkbox} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5f5069', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                    <input 
                      name="is_active" 
                      type="checkbox" 
                      defaultChecked={editingCategory ? editingCategory.is_active : true} 
                    />
                    Đang hiển thị danh mục này
                  </label>
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className={styles.ghostButton}
                  disabled={isPending}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className={styles.button}
                  disabled={isPending}
                >
                  {isPending ? 'Đang lưu...' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
