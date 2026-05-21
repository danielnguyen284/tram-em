-- ============================================================
-- Migration: Chuyển sang luồng liên hệ thủ công (bỏ SePay)
-- ============================================================

-- Thêm cột thông tin liên hệ vào bảng orders
alter table orders add column if not exists contact_phone text;
alter table orders add column if not exists contact_facebook text;

-- Đổi constraint trạng thái đơn hàng: chỉ còn 3 trạng thái
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'completed', 'cancelled'));

-- Cập nhật các đơn cũ có status không hợp lệ về pending
update orders set status = 'pending'
  where status not in ('pending', 'completed', 'cancelled');

-- Đổi giá trị mặc định payment_method
alter table orders alter column payment_method set default 'manual';
