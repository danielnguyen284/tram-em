-- ============================================================
-- Trạm Êm — Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ─── Product Categories ──────────────────────────────────────
insert into product_categories (name, slug, sort_order) values
('Tinh dầu', 'tinh-dau', 1),
('Nến thơm', 'nen-thom', 2),
('Sổ viết', 'so-viet', 3),
('Bộ thư giãn', 'bo-thu-gian', 4),
('Âm thanh', 'am-thanh', 5)
on conflict (name) do update set
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ─── Products ────────────────────────────────────────────────
insert into products (slug, name, category, price, old_price, description, details, images, tags, stock, rating) values
(
  'tinh-dau-lavender-dem-yen',
  'Tinh dầu Lavender Đêm Yên',
  'Tinh dầu',
  189000, 229000,
  'Mùi lavender dịu nhẹ cho những buổi tối cần hạ nhịp, phù hợp khuếch tán trước khi ngủ hoặc khi đọc sách.',
  array['Dung tích 15ml', 'Hương lavender, gỗ tuyết tùng', 'Dùng với máy khuếch tán hoặc đá thơm'],
  array['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=900&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=900&auto=format&fit=crop&q=80'],
  array['Ngủ ngon', 'Dịu nhẹ'],
  24, 4.8
),
(
  'nen-thom-mua-em',
  'Nến thơm Mưa Êm',
  'Nến thơm',
  249000, null,
  'Nến sáp đậu nành với tầng hương mưa, trà trắng và gỗ ấm, tạo cảm giác căn phòng sạch và yên.',
  array['Sáp đậu nành tự nhiên', 'Thời gian cháy 36 giờ', 'Ly thủy tinh tái sử dụng'],
  array['https://images.unsplash.com/photo-1603006905003-be475563bc59?w=900&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1602874801006-2f9487aa5551?w=900&auto=format&fit=crop&q=80'],
  array['Bán chạy', 'Không gian'],
  16, 4.9
),
(
  'so-viet-loi-diu-dang',
  'Sổ viết Lời Dịu Dàng',
  'Sổ viết',
  129000, 159000,
  'Sổ guided journal với prompt ngắn mỗi ngày, giúp bạn ghi lại cảm xúc mà không thấy quá nặng.',
  array['120 trang giấy kem', '30 prompt chăm sóc cảm xúc', 'Bìa mềm chống bám bẩn'],
  array['https://images.unsplash.com/photo-1517842645767-c639042777db?w=900&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?w=900&auto=format&fit=crop&q=80'],
  array['Viết cảm xúc', 'Mỗi ngày'],
  42, 4.7
),
(
  'hop-thu-gian-cuoi-tuan',
  'Hộp thư giãn Cuối Tuần',
  'Bộ thư giãn',
  399000, 459000,
  'Một bộ nhỏ gồm trà thảo mộc, nến mini, đá thơm và thẻ gợi ý thở chậm cho cuối tuần ở nhà.',
  array['1 nến mini 80g', '5 gói trà hoa cúc', '1 đá thơm ceramic', '12 thẻ chăm sóc bản thân'],
  array['https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=900&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80'],
  array['Quà tặng', 'Combo'],
  10, 4.9
),
(
  'the-am-thanh-rung-nho',
  'Thẻ âm thanh Rừng Nhỏ',
  'Âm thanh',
  99000, null,
  'Thẻ QR mở playlist âm thanh thiên nhiên được tuyển chọn cho 7 buổi nghỉ ngơi ngắn.',
  array['7 track thiên nhiên', 'Mỗi track 20-40 phút', 'Tặng kèm hướng dẫn nghe chậm'],
  array['https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&auto=format&fit=crop&q=80'],
  array['Digital', 'Thiên nhiên'],
  99, 4.6
),
(
  'tra-thao-moc-ngoi-xuong-thoi',
  'Trà thảo mộc Ngồi Xuống Thôi',
  'Bộ thư giãn',
  169000, null,
  'Trà hoa cúc, bạc hà và táo đỏ, hợp với những lúc cần một khoảng dừng nhẹ giữa ngày.',
  array['12 túi lọc', 'Không caffeine', 'Hương thảo mộc thanh nhẹ'],
  array['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=900&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=900&auto=format&fit=crop&q=80'],
  array['Không caffeine', 'Ấm bụng'],
  31, 4.8
);

update products
set
  detail_story = description || ' Đây là phần nội dung chi tiết có thể chỉnh trong admin để mô tả rõ hơn cảm giác, cách dùng và lý do sản phẩm phù hợp với khách hàng.',
  usage_tips = array[
    'Dùng trong khoảng nghỉ ngắn để tạo một nhịp chăm sóc bản thân.',
    'Kết hợp với vài phút hít thở chậm hoặc một không gian yên tĩnh.',
    'Bắt đầu với lượng vừa đủ và điều chỉnh theo cảm giác của bạn.'
  ],
  suitable_for = array[
    'Người muốn có một thói quen thư giãn nhẹ nhàng',
    'Người thích những món dễ dùng trong sinh hoạt hằng ngày',
    'Người đang tìm một món quà nhỏ có cảm giác được chăm sóc'
  ],
  shipping_note = 'Đóng gói chắc chắn, ưu tiên giữ sản phẩm nguyên vẹn khi tới tay bạn.',
  return_note = 'Nếu sản phẩm bị lỗi do vận chuyển hoặc sản xuất, Trạm Êm hỗ trợ đổi trả theo chính sách.',
  quality_note = 'Mỗi đơn được rà lại số lượng, ảnh sản phẩm và thông tin nhận hàng trước khi bàn giao.'
where detail_story is null;

-- ─── Sounds ──────────────────────────────────────────────────
insert into sounds (name, category, mood, duration, icon, image_url, audio_url, sort_order) values
('Mưa rơi trên lá', 'ASMR', 'Như một làn gió cổ', '40 phút', 'rain',
 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=700&auto=format&fit=crop&q=80',
 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_515949e29a.mp3?filename=rain-on-window-17482.mp3', 1),

('Rừng cây xanh mát', 'Nhạc thiền', 'Dịu ngọt', '20 phút', 'forest',
 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&auto=format&fit=crop&q=80',
 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_f5904d6023.mp3?filename=forest-birds-6738.mp3', 2),

('Nâng niu đã ấm', 'Thư giãn', 'Nâng niu đã ấm', '60 phút', 'lake',
 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&auto=format&fit=crop&q=80',
 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_3387799516.mp3?filename=ocean-waves-112937.mp3', 3),

('Năng lượng dòng suối', 'Năng lượng', 'Năng lượng dòng suối', '45 phút', 'river',
 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=700&auto=format&fit=crop&q=80',
 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_2744888898.mp3?filename=frogs-and-crickets-7142.mp3', 4),

('Như một làn gió nhẹ', 'ASMR', 'Như một làn gió nhẹ', '70 phút', 'wind',
 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=700&auto=format&fit=crop&q=80',
 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_32c9e76742.mp3?filename=meditation-bowl-16168.mp3', 5),

('Câu chuyện núi rừng', 'Truyện audio', 'Câu chuyện núi rừng', '30 phút', 'story',
 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=700&auto=format&fit=crop&q=80',
 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a1670f.mp3?filename=campfire-16167.mp3', 6),

('Đêm hồ yên tĩnh', 'Thư giãn', 'Đêm hồ yên tĩnh', '30 phút', 'night',
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&auto=format&fit=crop&q=80',
 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_f5904d6023.mp3?filename=forest-birds-6738.mp3', 7),

('Lửa trại ấm áp', 'Thư giãn', 'Lửa trại ấm áp', '70 phút', 'fire',
 'https://images.unsplash.com/photo-1477160739634-171ff0343882?w=700&auto=format&fit=crop&q=80',
 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a1670f.mp3?filename=campfire-16167.mp3', 8);

-- ─── Community Moderation Terms ──────────────────────────────
insert into community_moderation_terms (term, action) values
('spam', 'block'),
('scam', 'block'),
('lừa đảo', 'block'),
('tự tử', 'review'),
('tự hại', 'review'),
('muốn chết', 'review')
on conflict (term, action) do nothing;
