'use client';

import { useState, useTransition, useMemo } from 'react';
import type { Profile } from '@/types/database';
import { createNotification, deleteNotification } from '@/app/admin/actions';
import { 
  Plus, Trash2, X, Search, Bell, Send, User, Globe, ExternalLink,
  Gift, ShoppingBag, MessageCircle, Info, AlertCircle, Sparkles,
  ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import styles from '../admin.module.css';

const notificationsPerPage = 10;

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Bell,
  Gift,
  ShoppingBag,
  MessageCircle,
  Info,
  AlertCircle,
  Sparkles
};

const iconOptions = [
  { value: 'Bell', label: 'Chuông thông báo (Mặc định)', icon: Bell },
  { value: 'Gift', label: 'Quà tặng & Khuyến mãi', icon: Gift },
  { value: 'ShoppingBag', label: 'Đơn hàng & Sản phẩm', icon: ShoppingBag },
  { value: 'MessageCircle', label: 'Trò chuyện & Cộng đồng', icon: MessageCircle },
  { value: 'Info', label: 'Thông tin hệ thống', icon: Info },
  { value: 'AlertCircle', label: 'Nhắc nhở & Cảnh báo', icon: AlertCircle },
  { value: 'Sparkles', label: 'Tính năng mới & Lời chúc', icon: Sparkles },
];

function NotificationIcon({ name }: { name: string | null }) {
  const IconComponent = iconMap[name || 'Bell'] || Bell;
  return <IconComponent size={14} />;
}

type NotificationItem = {
  id: string;
  created_at: string;
  user_id: string | null;
  title: string;
  body: string;
  icon: string | null;
  href: string | null;
  is_read: boolean;
};

type Props = {
  initialNotifications: NotificationItem[];
  profiles: Profile[];
};

export default function NotificationsClient({ initialNotifications, profiles }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState('Bell');
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);
  const [recipientId, setRecipientId] = useState<string>('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientDropdownOpen, setRecipientDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create a profile map for fast recipient lookup
  const profileMap = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  // Filter profiles for custom searchable dropdown
  const filteredProfiles = useMemo(() => {
    if (!recipientSearch) return profiles;
    const term = recipientSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return profiles.filter((p) => {
      const name = (p.display_name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const phone = (p.phone || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      return name.includes(term) || phone.includes(term) || email.includes(term);
    });
  }, [profiles, recipientSearch]);

  // Format date client-side to prevent hydration mismatch
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered notifications
  const visibleNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((item) => {
      // 1. Filter by status
      if (statusFilter === 'unread' && item.is_read) return false;
      if (statusFilter === 'read' && !item.is_read) return false;

      // 2. Filter by search query
      if (!query) return true;
      const matchesText = 
        item.title.toLowerCase().includes(query) ||
        item.body.toLowerCase().includes(query) ||
        (item.href && item.href.toLowerCase().includes(query));

      const recipientProfile = item.user_id ? profileMap.get(item.user_id) : null;
      const matchesRecipient = 
        (!item.user_id && 'tất cả'.includes(query)) ||
        (recipientProfile?.display_name && recipientProfile.display_name.toLowerCase().includes(query)) ||
        (recipientProfile?.phone && recipientProfile.phone.includes(query)) ||
        (item.user_id && item.user_id.toLowerCase().includes(query));

      return matchesText || matchesRecipient;
    });
  }, [notifications, search, statusFilter, profileMap]);

  const totalPages = Math.max(1, Math.ceil(visibleNotifications.length / notificationsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageNotifications = visibleNotifications.slice(
    (currentPage - 1) * notificationsPerPage,
    currentPage * notificationsPerPage
  );

  // Handle delete
  const handleDeleteClick = (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa/thu hồi thông báo "${title}"?`)) {
      return;
    }
    
    startTransition(async () => {
      try {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        alert('Không thể xóa thông báo.');
      }
    });
  };

  // Handle modal submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await createNotification(formData);
        
        // Refresh local list. Since createNotification is a server action that updates path,
        // we can fetch fresh or wait for server revalidation, or just close the modal.
        // For absolute instant update, we can reload page or trigger optimistic updates.
        // Reload is safest to pull the generated rows (especially for "all users" which generates multiple rows).
        window.location.reload();
      } catch (err) {
        alert('Không thể tạo thông báo.');
      }
    });
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1>Quản lý thông báo</h1>
          <p>Tạo thông báo quảng bá tới toàn bộ thành viên hoặc gửi tin nhắn riêng cho từng khách hàng.</p>
        </div>
        <button 
          onClick={() => {
            setIsOpen(true);
            setSelectedIcon('Bell');
            setIconDropdownOpen(false);
            setRecipientId('');
            setRecipientSearch('');
            setRecipientDropdownOpen(false);
          }} 
          className={styles.button}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          Tạo thông báo mới
        </button>
      </header>

      <section className={styles.panel} style={{ marginTop: '20px' }}>
        <div className={styles.panelHeader}>
          <h2>Danh sách thông báo</h2>
          <span className={styles.muted}>{visibleNotifications.length} mục</span>
        </div>

        <nav className={styles.filterNav} aria-label="Bộ lọc và tìm kiếm thông báo">
          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.filterTab} ${statusFilter === 'all' ? styles.filterTabActive : ''}`}
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${statusFilter === 'unread' ? styles.filterTabActive : ''}`}
              onClick={() => {
                setStatusFilter('unread');
                setPage(1);
              }}
            >
              Chưa đọc
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${statusFilter === 'read' ? styles.filterTabActive : ''}`}
              onClick={() => {
                setStatusFilter('read');
                setPage(1);
              }}
            >
              Đã đọc
            </button>
          </div>
          
          <label className={styles.orderSearch}>
            <Search size={16} />
            <input
              type="search"
              value={search}
              placeholder="Tìm theo tiêu đề, nội dung, người nhận..."
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </nav>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Thông báo</th>
              <th>Người nhận</th>
              <th>Đường dẫn</th>
              <th>Trạng thái</th>
              <th>Thời gian gửi</th>
              <th style={{ width: '80px' }}></th>
            </tr>
          </thead>
          <tbody>
            {pageNotifications.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#75667e' }}>
                  Không tìm thấy thông báo nào phù hợp.
                </td>
              </tr>
            )}
            {pageNotifications.map((item) => {
              const recipientProfile = item.user_id ? profileMap.get(item.user_id) : null;
              
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#f3eef5',
                        color: '#8e6c9f',
                        display: 'grid',
                        placeItems: 'center',
                        marginTop: '2px',
                        flexShrink: 0
                      }}>
                        <NotificationIcon name={item.icon} />
                      </div>
                      <div style={{ display: 'grid', gap: '3px' }}>
                        <strong style={{ color: '#382240', fontSize: '14px' }}>{item.title}</strong>
                        <span style={{ color: '#75667e', fontSize: '13px', lineHeight: '1.4' }}>{item.body}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.user_id ? (
                      <div style={{ display: 'grid', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#5f5069', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} className={styles.muted} />
                          {recipientProfile?.display_name || 'Khách hàng'}
                        </span>
                        {recipientProfile?.phone && (
                          <span style={{ fontSize: '11px', color: '#908298' }}>{recipientProfile.phone}</span>
                        )}
                      </div>
                    ) : (
                      <span style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 800,
                        borderRadius: '999px',
                        background: '#eef8f5',
                        color: '#2d8471',
                        border: '1px solid #d4ede7',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Globe size={11} />
                        Tất cả khách hàng
                      </span>
                    )}
                  </td>
                  <td>
                    {item.href ? (
                      <a 
                        href={item.href} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: '13px', color: '#88629d', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        {item.href}
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className={styles.muted}>-</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.status} ${!item.is_read ? styles.statusOff : ''}`}>
                      {item.is_read ? 'Đã đọc' : 'Chưa đọc'}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#75667e' }}>
                    {formatDate(item.created_at)}
                  </td>
                  <td>
                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleDeleteClick(item.id, item.title)} 
                        className={styles.dangerButton}
                        style={{ padding: '6px', minHeight: '30px' }}
                        title="Xóa thông báo"
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

        {totalPages > 1 && (
          <footer className={styles.pagination}>
            <span className={styles.muted}>
              Trang {currentPage}/{totalPages}
            </span>
            <div className={styles.paginationActions}>
              <button
                type="button"
                className={styles.paginationButton}
                aria-label="Trang trước"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={currentPage === pageNumber ? 'page' : undefined}
                    className={`${styles.paginationButton} ${currentPage === pageNumber ? styles.paginationButtonActive : ''}`}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                className={styles.paginationButton}
                aria-label="Trang sau"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </footer>
        )}
      </section>

      {/* Create Notification Modal */}
      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3>Gửi thông báo mới</h3>
              <button onClick={() => setIsOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className={styles.modalBody}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  
                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, position: 'relative' }}>
                    Người nhận
                    <input type="hidden" name="user_id" value={recipientId} />
                    <button
                      type="button"
                      onClick={() => setRecipientDropdownOpen(!recipientDropdownOpen)}
                      className={styles.inlineSelect}
                      style={{
                        padding: '8px 12px',
                        background: '#fff',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        width: '100%',
                        minHeight: '38px',
                        border: '1px solid #d2c3d9'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                        {recipientId === '' ? (
                          <>
                            <Globe size={14} style={{ color: '#8e6c9f' }} />
                            Tất cả khách hàng (Quảng bá công khai)
                          </>
                        ) : (
                          <>
                            <User size={14} style={{ color: '#8e6c9f' }} />
                            {(() => {
                              const p = profileMap.get(recipientId);
                              return p ? `${p.display_name || 'Khách hàng'} (${p.phone || 'Không số ĐT'})` : recipientId;
                            })()}
                          </>
                        )}
                      </span>
                      <ChevronDown size={14} style={{ color: '#8a7a94' }} />
                    </button>

                    {recipientDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #d2c3d9',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        marginTop: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}>
                        {/* Search Input Header */}
                        <div style={{
                          padding: '8px',
                          borderBottom: '1px solid #eae2ec',
                          background: '#fcfafc',
                          position: 'relative'
                        }}>
                          <Search size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8a7a94' }} />
                          <input
                            type="text"
                            placeholder="Tìm tên, số điện thoại, email..."
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px 6px 28px',
                              fontSize: '13px',
                              borderRadius: '6px',
                              border: '1px solid #d2c3d9',
                              outline: 'none',
                              background: '#fff'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* List Options */}
                        <div style={{
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          {/* Option for public broadcast */}
                          {(!recipientSearch || 'tat ca khach hang quang ba cong khai'.includes(recipientSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) && (
                            <button
                              type="button"
                              onClick={() => {
                                setRecipientId('');
                                setRecipientDropdownOpen(false);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: recipientId === '' ? '#f3ebf5' : 'transparent',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#3c3043',
                                fontWeight: recipientId === '' ? 700 : 500
                              }}
                              onMouseEnter={(e) => {
                                if (recipientId !== '') e.currentTarget.style.background = '#f9f6fa';
                              }}
                              onMouseLeave={(e) => {
                                if (recipientId !== '') e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <Globe size={14} style={{ color: '#8e6c9f' }} />
                              Tất cả khách hàng (Quảng bá công khai)
                            </button>
                          )}

                          {filteredProfiles.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#8a7a94' }}>
                              Không tìm thấy khách hàng nào
                            </div>
                          ) : (
                            filteredProfiles.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setRecipientId(p.id);
                                  setRecipientDropdownOpen(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: recipientId === p.id ? '#f3ebf5' : 'transparent',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  color: '#3c3043',
                                  fontWeight: recipientId === p.id ? 700 : 500
                                }}
                                onMouseEnter={(e) => {
                                  if (recipientId !== p.id) e.currentTarget.style.background = '#f9f6fa';
                                }}
                                onMouseLeave={(e) => {
                                  if (recipientId !== p.id) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <User size={14} style={{ color: '#8e6c9f' }} />
                                <div>
                                  <span style={{ display: 'block' }}>
                                    {p.display_name || 'Khách hàng chưa đặt tên'}
                                  </span>
                                  <span style={{ display: 'block', fontSize: '11px', color: '#8a7a94', marginTop: '1px' }}>
                                    {p.phone ? `SĐT: ${p.phone}` : 'Không số ĐT'} {p.email ? `| ${p.email}` : ''}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, position: 'relative' }}>
                      Biểu tượng (Icon)
                      <input type="hidden" name="icon" value={selectedIcon} />
                      <button
                        type="button"
                        onClick={() => setIconDropdownOpen(!iconDropdownOpen)}
                        className={styles.inlineSelect}
                        style={{
                          padding: '8px 12px',
                          background: '#fff',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          width: '100%',
                          minHeight: '38px',
                          border: '1px solid #d2c3d9'
                        }}
                      >
                        <NotificationIcon name={selectedIcon} />
                        <span style={{ fontWeight: 500 }}>
                          {iconOptions.find(o => o.value === selectedIcon)?.label || 'Chuông thông báo'}
                        </span>
                      </button>

                      {iconDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#fff',
                          border: '1px solid #d2c3d9',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          zIndex: 100,
                          marginTop: '4px',
                          maxHeight: '240px',
                          overflowY: 'auto'
                        }}>
                          {iconOptions.map((opt) => {
                            const OptIcon = opt.icon;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setSelectedIcon(opt.value);
                                  setIconDropdownOpen(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: selectedIcon === opt.value ? '#f3ebf5' : 'transparent',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  color: '#3c3043',
                                  fontWeight: selectedIcon === opt.value ? 700 : 500,
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedIcon !== opt.value) {
                                    e.currentTarget.style.background = '#f9f6fa';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedIcon !== opt.value) {
                                    e.currentTarget.style.background = 'transparent';
                                  }
                                }}
                              >
                                <OptIcon size={14} style={{ color: '#8e6c9f' }} />
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </label>

                    <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                      Đường dẫn chuyển hướng (Link)
                      <input 
                        name="href" 
                        placeholder="/soundscape hoặc /shop..."
                        className={styles.inlineSelect}
                        style={{ padding: '8px 12px' }}
                      />
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Tiêu đề thông báo
                    <input 
                      name="title" 
                      required 
                      placeholder="Nhập tiêu đề ngắn gọn, thu hút..."
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Nội dung thông báo
                    <textarea 
                      name="body" 
                      required 
                      rows={4}
                      placeholder="Nhập chi tiết nội dung thông báo gửi tới khách hàng..."
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px', resize: 'vertical' }}
                    />
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  disabled={isPending}
                >
                  <Send size={14} />
                  {isPending ? 'Đang gửi...' : 'Gửi thông báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
