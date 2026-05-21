'use client';

import { updateOrderStatus } from '@/app/admin/actions';
import type { Order } from '@/types/database';
import { formatVnd, timeAgo } from '@/utils/format';
import { ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Phone, Search } from 'lucide-react';
import Image from 'next/image';
import { Fragment, useMemo, useState, useTransition } from 'react';
import styles from '../admin.module.css';

type OrderStatus = Order['status'];
type OrderFilter = OrderStatus | 'all';

const ordersPerPage = 5;

const orderStatusNames: Record<OrderStatus, string> = {
  pending: 'Đang xử lý',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

const orderStatuses = Object.keys(orderStatusNames) as OrderStatus[];

const statusFilters: { label: string; value: OrderFilter }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang xử lý', value: 'pending' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' },
];

function getDraftStatuses(orders: Order[]) {
  return Object.fromEntries(orders.map((order) => [order.id, order.status])) as Record<string, OrderStatus>;
}

function normalizeSearchValue(value: string | null) {
  return (value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi-VN');
}

function normalizePhoneValue(value: string | null) {
  return (value ?? '').replace(/\D/g, '');
}

export function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [search, setSearch] = useState('');
  const [draftStatuses, setDraftStatuses] = useState(() => getDraftStatuses(initialOrders));
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleOrders = useMemo(() => {
    const textSearch = normalizeSearchValue(search);
    const phoneSearch = normalizePhoneValue(search);

    return orders.filter((order) => {
      const matchesStatus = filter === 'all' || order.status === filter;
      const matchesName = normalizeSearchValue(order.shipping_name).includes(textSearch);
      const matchesShippingPhone = phoneSearch.length > 0
        && normalizePhoneValue(order.shipping_phone).includes(phoneSearch);
      const matchesContactPhone = phoneSearch.length > 0
        && normalizePhoneValue(order.contact_phone).includes(phoneSearch);
      const matchesSearch = !textSearch || matchesName || matchesShippingPhone || matchesContactPhone;

      return matchesStatus && matchesSearch;
    });
  }, [filter, orders, search]);

  const totalPages = Math.max(1, Math.ceil(visibleOrders.length / ordersPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageOrders = visibleOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

  function changeFilter(nextFilter: OrderFilter) {
    setFilter(nextFilter);
    setPage(1);
    setExpandedOrderId(null);
  }

  function changeSearch(nextSearch: string) {
    setSearch(nextSearch);
    setPage(1);
    setExpandedOrderId(null);
  }

  function toggleOrder(orderId: string) {
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
  }

  function changePage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
    setExpandedOrderId(null);
  }

  function saveStatus(order: Order, status: OrderStatus) {
    if (status === order.status) return;

    setError(null);
    setSavingOrderId(order.id);
    setDraftStatuses((current) => ({ ...current, [order.id]: status }));

    startTransition(async () => {
      try {
        const result = await updateOrderStatus(order.id, status);

        if (!result.ok) {
          setError(result.message);
          setDraftStatuses((current) => ({ ...current, [order.id]: order.status }));
          return;
        }

        setOrders((current) =>
          current.map((item) => (item.id === order.id ? { ...item, status } : item)),
        );
      } catch {
        setError('Không thể cập nhật trạng thái đơn hàng.');
        setDraftStatuses((current) => ({ ...current, [order.id]: order.status }));
      } finally {
        setSavingOrderId(null);
      }
    });
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Đơn hàng</h2>
        <span className={styles.muted}>{visibleOrders.length} đơn</span>
      </div>

      <nav className={styles.filterNav} aria-label="Lọc đơn hàng theo trạng thái">
        <div className={styles.filterTabs}>
          {statusFilters.map((statusFilter) => (
            <button
              key={statusFilter.value}
              type="button"
              aria-pressed={filter === statusFilter.value}
              className={`${styles.filterTab} ${filter === statusFilter.value ? styles.filterTabActive : ''}`}
              onClick={() => changeFilter(statusFilter.value)}
            >
              {statusFilter.label}
            </button>
          ))}
        </div>
        <label className={styles.orderSearch}>
          <Search size={16} />
          <input
            type="search"
            value={search}
            placeholder="Tìm tên khách, số điện thoại"
            aria-label="Tìm đơn hàng theo tên khách hoặc số điện thoại"
            onChange={(event) => changeSearch(event.target.value)}
          />
        </label>
      </nav>

      {error && <p className={styles.orderError} role="alert">{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Khách hàng</th>
            <th>Tổng</th>
            <th>Liên hệ</th>
            <th>Thời gian</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {visibleOrders.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.emptyTableCell}>
                Không có đơn hàng nào.
              </td>
            </tr>
          )}
          {pageOrders.map((order) => {
            const draftStatus = draftStatuses[order.id] ?? order.status;
            const isSaving = isPending && savingOrderId === order.id;
            const isExpanded = expandedOrderId === order.id;
            const items = order.items ?? [];

            return (
              <Fragment key={order.id}>
                <tr
                  className={styles.orderRow}
                  onClick={() => toggleOrder(order.id)}
                >
                  <td>
                    <button
                      type="button"
                      className={styles.orderExpandButton}
                      aria-expanded={isExpanded}
                      aria-controls={`order-items-${order.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleOrder(order.id);
                      }}
                    >
                      <ChevronDown size={16} />
                      <span className={styles.orderCode}>#{order.id.slice(0, 8).toUpperCase()}</span>
                    </button>
                  </td>
                  <td>
                    <strong>{order.shipping_name ?? 'Khách hàng'}</strong>
                    <p className={styles.muted}>{order.shipping_phone}</p>
                  </td>
                  <td><strong>{formatVnd(order.total)}</strong></td>
                  <td>
                    <div className={styles.contactList}>
                      {order.contact_phone && (
                        <span className={styles.contactItem}>
                          <Phone size={13} />
                          {order.contact_phone}
                        </span>
                      )}
                      {order.contact_facebook && (
                        <span className={styles.contactItem}>
                          <MessageSquare size={13} />
                          {order.contact_facebook}
                        </span>
                      )}
                      {!order.contact_phone && !order.contact_facebook && (
                        <span className={styles.muted}>Chưa có</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.muted}>{timeAgo(order.created_at)}</td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <div className={styles.statusForm}>
                      <select
                        aria-label={`Trạng thái đơn ${order.id.slice(0, 8)}`}
                        value={draftStatus}
                        className={styles.statusSelect}
                        disabled={isSaving}
                        onChange={(event) => saveStatus(order, event.target.value as OrderStatus)}
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>{orderStatusNames[status]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr id={`order-items-${order.id}`} className={styles.orderDetailsRow}>
                    <td colSpan={6}>
                      <div className={styles.orderItemsPanel}>
                        <div className={styles.orderItemsHeader}>
                          <strong>Sản phẩm trong đơn</strong>
                          <span className={styles.muted}>{items.length} sản phẩm</span>
                        </div>
                        {items.length === 0 ? (
                          <p className={styles.orderItemsEmpty}>Đơn hàng chưa có sản phẩm.</p>
                        ) : (
                          <div className={styles.orderItemsList}>
                            {items.map((item) => (
                              <div key={item.id} className={styles.orderItem}>
                                <div className={styles.orderItemProduct}>
                                  <div className={styles.orderItemImage}>
                                    {item.product_image ? (
                                      <Image
                                        src={item.product_image}
                                        alt={item.product_name}
                                        fill
                                        sizes="54px"
                                      />
                                    ) : (
                                      <span aria-hidden="true">Chưa có ảnh</span>
                                    )}
                                  </div>
                                  <div>
                                    <strong>{item.product_name}</strong>
                                    <p className={styles.muted}>
                                      {formatVnd(item.price)} x {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                <strong>{formatVnd(item.price * item.quantity)}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
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
              onClick={() => changePage(currentPage - 1)}
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
                  onClick={() => changePage(pageNumber)}
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
              onClick={() => changePage(currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}
