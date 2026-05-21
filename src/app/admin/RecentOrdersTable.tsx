'use client';

import { useState, useTransition } from 'react';
import type { Order } from '@/types/database';
import { updateOrderStatus } from '@/app/admin/actions';
import { formatVnd } from '@/utils/format';
import styles from './admin.module.css';

type OrderStatus = Order['status'];

const orderStatusNames: Record<OrderStatus, string> = {
  pending: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

type Props = {
  initialOrders: Order[];
};

export default function RecentOrdersTable({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, nextStatus);
      if (res.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: nextStatus as OrderStatus } : order
          )
        );
      } else {
        alert(res.message || 'Lỗi cập nhật trạng thái đơn hàng.');
      }
      setUpdatingId(null);
    });
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Mã</th>
          <th>Khách hàng</th>
          <th>Số điện thoại</th>
          <th>Trạng thái</th>
          <th>Tổng tiền</th>
        </tr>
      </thead>
      <tbody>
        {orders.length === 0 && (
          <tr>
            <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#75667e' }}>
              Chưa có đơn hàng nào mới.
            </td>
          </tr>
        )}
        {orders.map((order) => {
          const isCurrentUpdating = updatingId === order.id;
          const phoneDisplay = order.contact_phone || order.shipping_phone || '-';
          
          return (
            <tr key={order.id}>
              <td>
                <span 
                  className={styles.orderCode} 
                  title={order.id}
                  style={{ display: 'inline-block', padding: '4px 8px', fontSize: '12px' }}
                >
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </td>
              <td>
                <strong>{order.shipping_name}</strong>
              </td>
              <td>
                <span className={styles.muted} style={{ fontSize: '13px' }}>
                  {phoneDisplay}
                </span>
              </td>
              <td>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={isCurrentUpdating || isPending}
                    className={`${styles.inlineSelect} ${
                      order.status === 'completed'
                        ? styles.statusSelectSuccess
                        : order.status === 'cancelled'
                        ? styles.statusSelectDanger
                        : styles.statusSelectWarning
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
                    }}
                  >
                    {Object.entries(orderStatusNames).map(([val, label]) => (
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
              <td>
                <strong>{formatVnd(order.total)}</strong>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
