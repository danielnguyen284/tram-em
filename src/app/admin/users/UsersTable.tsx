'use client';

import { useState, useTransition, useMemo } from 'react';
import type { Profile } from '@/types/database';
import { updateProfileRole } from '@/app/admin/actions';
import { timeAgo } from '@/utils/format';
import { ChevronLeft, ChevronRight, Search, User, Mail, Phone } from 'lucide-react';
import styles from '../admin.module.css';

type UserRole = Profile['role'];
type RoleFilter = UserRole | 'all';

const usersPerPage = 10;

const roleStatusNames: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  customer: 'Khách hàng',
};

const roleFilters: { label: string; value: RoleFilter }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Quản trị viên', value: 'admin' },
  { label: 'Khách hàng', value: 'customer' },
];

function normalizeSearchValue(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi-VN');
}

export default function UsersTable({ initialProfiles }: { initialProfiles: Profile[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleProfiles = useMemo(() => {
    const textSearch = normalizeSearchValue(search);

    return profiles.filter((profile) => {
      const matchesRole = filter === 'all' || profile.role === filter;
      
      const matchesName = normalizeSearchValue(profile.display_name).includes(textSearch);
      const matchesUsername = normalizeSearchValue(profile.username).includes(textSearch);
      const matchesEmail = normalizeSearchValue(profile.email).includes(textSearch);
      const matchesPhone = normalizeSearchValue(profile.phone).includes(textSearch);
      
      const matchesSearch = !textSearch 
        || matchesName 
        || matchesUsername 
        || matchesEmail 
        || matchesPhone;

      return matchesRole && matchesSearch;
    });
  }, [filter, profiles, search]);

  const totalPages = Math.max(1, Math.ceil(visibleProfiles.length / usersPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageProfiles = visibleProfiles.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage,
  );

  const handleRoleChange = async (profileId: string, nextRole: string) => {
    setUpdatingId(profileId);

    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', profileId);
      formData.set('role', nextRole);

      try {
        await updateProfileRole(formData);
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, role: nextRole as UserRole } : p))
        );
      } catch (error) {
        console.error(error);
        alert('Không thể cập nhật quyền người dùng.');
      } finally {
        setUpdatingId(null);
      }
    });
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Danh sách tài khoản</h2>
        <span className={styles.muted}>{visibleProfiles.length} người dùng</span>
      </div>

      <nav className={styles.filterNav} aria-label="Lọc và tìm kiếm tài khoản">
        <div className={styles.filterTabs}>
          {roleFilters.map((rf) => (
            <button
              key={rf.value}
              type="button"
              className={`${styles.filterTab} ${filter === rf.value ? styles.filterTabActive : ''}`}
              onClick={() => {
                setFilter(rf.value);
                setPage(1);
              }}
            >
              {rf.label}
            </button>
          ))}
        </div>
        <label className={styles.orderSearch}>
          <Search size={16} />
          <input
            type="search"
            value={search}
            placeholder="Tìm tên, email, số điện thoại..."
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
            <th>Tên hiển thị</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Ngày tạo</th>
            <th>Vai trò</th>
          </tr>
        </thead>
        <tbody>
          {pageProfiles.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#75667e' }}>
                Không tìm thấy người dùng phù hợp.
              </td>
            </tr>
          )}
          {pageProfiles.map((profile) => {
            const isCurrentUpdating = updatingId === profile.id;
            const initials = (profile.display_name || 'U').slice(0, 1).toUpperCase();
            
            return (
              <tr key={profile.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#f3ebf5',
                      color: '#7f63a3',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                      overflow: 'hidden',
                      border: '1px solid #e2d2e6'
                    }}>
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.display_name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initials
                      )}
                    </div>
                    <div>
                      <strong style={{ display: 'block' }}>{profile.display_name || 'Chưa đặt tên'}</strong>
                      {profile.username && (
                        <span className={styles.muted} style={{ fontSize: '11px', display: 'block', marginTop: '-2px' }}>
                          @{profile.username}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  {profile.email ? (
                    <span style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#5f5069' }}>
                      <Mail size={12} className={styles.muted} />
                      {profile.email}
                    </span>
                  ) : (
                    <span className={styles.muted}>-</span>
                  )}
                </td>
                <td>
                  {profile.phone ? (
                    <span style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#5f5069' }}>
                      <Phone size={12} className={styles.muted} />
                      {profile.phone}
                    </span>
                  ) : (
                    <span className={styles.muted}>-</span>
                  )}
                </td>
                <td className={styles.muted} style={{ fontSize: '13px' }}>{timeAgo(profile.created_at)}</td>
                <td>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={profile.role}
                      onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                      disabled={isCurrentUpdating || isPending}
                      className={`${styles.inlineSelect} ${
                        profile.role === 'admin' ? styles.statusSelectSuccess : styles.statusSelectWarning
                      }`}
                      style={{
                        padding: '4px 10px',
                        fontSize: '13px',
                        fontWeight: 800,
                        borderRadius: '999px',
                        border: 'none',
                        cursor: 'pointer',
                        minHeight: '28px',
                        outline: 'none',
                        width: 'auto'
                      }}
                    >
                      {Object.entries(roleStatusNames).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {isCurrentUpdating && (
                      <span style={{ fontSize: '11px', color: '#8a7a94' }}>đang lưu...</span>
                    )}
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
  );
}
