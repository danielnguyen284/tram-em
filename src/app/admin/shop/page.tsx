import { saveProduct, toggleProductActive, updateOrderStatus } from '@/app/admin/actions';
import { getAdminOrders, getAdminProducts } from '@/lib/admin/data';
import { formatVnd, timeAgo } from '@/utils/format';
import styles from '../admin.module.css';

const orderStatusNames: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
};
const orderStatuses = Object.keys(orderStatusNames);

export default async function AdminShopPage() {
  const [products, orders] = await Promise.all([getAdminProducts(), getAdminOrders()]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Quản lý cửa hàng</h1>
          <p>Quản lý sản phẩm, tồn kho, giá và trạng thái đơn hàng.</p>
        </div>
      </header>

      <section className={styles.split}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Sản phẩm</h2>
            <span className={styles.muted}>{products.length} mục</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{formatVnd(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`${styles.status} ${!product.is_active ? styles.statusOff : ''}`}>
                      {product.is_active ? 'Đang bán' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td>
                    <form action={toggleProductActive}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="is_active" value={String(product.is_active)} />
                      <button className={styles.ghostButton} type="submit">
                        {product.is_active ? 'Ẩn' : 'Hiện'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Thêm sản phẩm</h2>
          </div>
          <form action={saveProduct} className={styles.formGrid}>
            <label>
              Tên
              <input name="name" required />
            </label>
            <label>
              Đường dẫn thân thiện (Slug)
              <input name="slug" placeholder="tự tạo nếu bỏ trống" />
            </label>
            <label>
              Danh mục
              <input name="category" required />
            </label>
            <label>
              Giá
              <input name="price" type="number" required />
            </label>
            <label>
              Giá cũ
              <input name="old_price" type="number" />
            </label>
            <label>
              Tồn kho
              <input name="stock" type="number" defaultValue={0} />
            </label>
            <label>
              Đánh giá (Rating)
              <input name="rating" type="number" step="0.1" min="0" max="5" defaultValue={0} />
            </label>
            <label>
              Tags
              <input name="tags" placeholder="ngủ ngon, dịu nhẹ" />
            </label>
            <label className={styles.fieldFull}>
              Mô tả
              <textarea name="description" required />
            </label>
            <label className={styles.fieldFull}>
              Chi tiết, mỗi dòng một mục
              <textarea name="details" />
            </label>
            <label className={styles.fieldFull}>
              Ảnh, mỗi dòng một URL
              <textarea name="images" required />
            </label>
            <label className={styles.checkbox}>
              <input name="is_active" type="checkbox" defaultChecked />
              Đang hiển thị
            </label>
            <div className={styles.formFooter}>
              <button type="submit" className={styles.button}>Lưu sản phẩm</button>
            </div>
          </form>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Đơn hàng</h2>
          <span className={styles.muted}>{orders.length} đơn</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Khách hàng</th>
              <th>Tổng</th>
              <th>Thanh toán</th>
              <th>Mã TT</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className={styles.truncate}>{order.id}</td>
                <td>
                  <strong>{order.shipping_name ?? 'Khách hàng'}</strong>
                  <p className={styles.muted}>{order.shipping_phone}</p>
                </td>
                <td>{formatVnd(order.total)}</td>
                <td>
                  <span className={`${styles.status} ${order.payment_status !== 'paid' ? styles.statusOff : ''}`}>
                    {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                  {order.payment_amount > 0 && (
                    <p className={styles.muted}>{formatVnd(order.payment_amount)}</p>
                  )}
                </td>
                <td className={styles.truncate}>{order.payment_code ?? '-'}</td>
                <td>{timeAgo(order.created_at)}</td>
                <td>
                  <form action={updateOrderStatus} className={styles.actions}>
                    <input type="hidden" name="id" value={order.id} />
                    <select name="status" defaultValue={order.status} className={styles.inlineSelect}>
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {orderStatusNames[status] ?? status}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={styles.ghostButton}>Cập nhật</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
