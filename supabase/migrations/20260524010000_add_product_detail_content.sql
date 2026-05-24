alter table public.products
  add column if not exists detail_story text,
  add column if not exists usage_tips text[] not null default '{}',
  add column if not exists suitable_for text[] not null default '{}',
  add column if not exists shipping_note text,
  add column if not exists return_note text,
  add column if not exists quality_note text;

update public.products
set
  detail_story = coalesce(
    detail_story,
    description || ' Sản phẩm được chọn để dễ dùng trong những khoảnh khắc cần chậm lại: trước khi ngủ, lúc nghỉ giữa ngày hoặc khi bạn muốn tạo một góc nhỏ dễ chịu hơn cho mình.'
  ),
  usage_tips = case
    when coalesce(array_length(usage_tips, 1), 0) > 0 then usage_tips
    when lower(category) like '%tinh dầu%' then array[
      'Nhỏ 3-5 giọt vào máy khuếch tán hoặc đá thơm trước khi nghỉ ngơi.',
      'Bắt đầu với lượng nhỏ để mùi hương lan nhẹ, không quá nồng trong phòng kín.',
      'Dùng vào buổi tối, khi đọc sách hoặc trước giờ ngủ để tạo nhịp thư giãn.'
    ]
    when lower(category) like '%sổ%' then array[
      'Viết vài dòng ngắn mỗi ngày, không cần đúng hay hoàn chỉnh.',
      'Dùng để ghi cảm xúc, điều biết ơn hoặc những suy nghĩ đang làm bạn nặng lòng.',
      'Để sổ ở nơi dễ thấy để việc viết trở thành một thói quen nhẹ nhàng.'
    ]
    else array[
      'Dùng trong những khoảng nghỉ ngắn để tạo một nhịp chăm sóc bản thân.',
      'Kết hợp với âm thanh dịu, ánh sáng mềm hoặc vài phút hít thở chậm.',
      'Phù hợp làm món quà nhỏ cho bản thân hoặc người đang cần được vỗ về.'
    ]
  end,
  suitable_for = case
    when coalesce(array_length(suitable_for, 1), 0) > 0 then suitable_for
    when coalesce(array_length(tags, 1), 0) > 0 then (
      select array_agg('Người cần cảm giác ' || lower(tag) || ' trong nhịp sống hằng ngày')
      from unnest(tags) as tag
    )
    else array[
      'Người muốn bắt đầu một thói quen thư giãn đơn giản',
      'Người thích những món nhỏ, dễ dùng và có cảm giác chăm sóc',
      'Người cần một lựa chọn quà tặng nhẹ nhàng'
    ]
  end,
  shipping_note = coalesce(shipping_note, 'Đóng gói chắc chắn, ưu tiên giữ sản phẩm nguyên vẹn khi tới tay bạn.'),
  return_note = coalesce(return_note, 'Nếu sản phẩm bị lỗi do vận chuyển hoặc sản xuất, Trạm Êm hỗ trợ đổi trả theo chính sách.'),
  quality_note = coalesce(quality_note, 'Mỗi đơn được rà lại số lượng, ảnh sản phẩm và thông tin nhận hàng trước khi bàn giao.');
