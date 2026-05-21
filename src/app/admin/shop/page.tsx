import {
  saveProduct,
  saveProductCategory,
  toggleProductActive,
  toggleProductCategoryActive,
  updateOrderStatus,
} from '@/app/admin/actions';
import { getAdminOrders, getAdminProductCategories, getAdminProducts } from '@/lib/admin/data';
import { formatVnd, timeAgo } from '@/utils/format';
import styles from '../admin.module.css';

const orderStatusNames: Record<string, string> = {
  pending: 'Đang xử lý',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};
const orderStatuses = Object.keys(orderStatusNames);

export default async function AdminShopPage() {
  const [products, orders, categories] = await Promise.all([
    getAdminProducts(),
    getAdminOrders(),
    getAdminProductCategories(),
  ]);
  const activeCategories = categories.filter((category) => category.is_active);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Quản lý cửa hàng</h1>
          <p>Quản lý danh mục, sản phẩm, tồn kho, giá và trạng thái đơn hàng.</p>
        </div>
      </header>

      <section className={styles.split}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Danh mục sản phẩm</h2>
            <span className={styles.muted}>{categories.length} mục</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Slug</th>
                <th>Thứ tự</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.sort_order}</td>
                  <td>
                    <span className={`${styles.status} ${!category.is_active ? styles.statusOff : ''}`}>
                      {category.is_active ? 'Đang hiện' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td>
                    <form action={toggleProductCategoryActive}>
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="is_active" value={String(category.is_active)} />
                      <button className={styles.ghostButton} type="submit">
                        {category.is_active ? 'Ẩn' : 'Hiện'}
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
            <h2>Thêm danh mục</h2>
          </div>
          <form action={saveProductCategory} className={styles.formGrid}>
            <label>
              Tên danh mục
              <input name="name" required />
            </label>
            <label>
              Slug
              <input name="slug" placeholder="tự tạo nếu bỏ trống" />
            </label>
            <label>
              Thứ tự
              <input name="sort_order" type="number" defaultValue={0} />
            </label>
            <label className={styles.checkbox}>
              <input name="is_active" type="checkbox" defaultChecked />
              Đang hiển thị
            </label>
            <div className={styles.formFooter}>
              <button type="submit" className={styles.button}>Lưu danh mục</button>
            </div>
          </form>
        </div>
      </section>

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
              <select name="category_id" required defaultValue="">
                <option value="" disabled>Chọn danh mục</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
              <th>Liên hệ</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className={styles.truncate}>#{order.id.slice(0, 8).toUpperCase()}</td>
                <td>
                  <strong>{order.shipping_name ?? 'Khách hàng'}</strong>
                  <p className={styles.muted}>{order.shipping_phone}</p>
                </td>
                <td>{formatVnd(order.total)}</td>
                <td>
                  {order.contact_phone && (
                    <p>📱 {order.contact_phone}</p>
                  )}
                  {order.contact_facebook && (
                    <p className={styles.muted}>👤 {order.contact_facebook}</p>
                  )}
                  {!order.contact_phone && !order.contact_facebook && (
                    <span className={styles.muted}>Chưa có</span>
                  )}
                </td>
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
