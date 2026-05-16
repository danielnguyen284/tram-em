export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  description: string;
  details: string[];
  images: string[];
  tags: string[];
  stock: number;
  rating: number;
};

export const shopCategories = [
  'Tất cả',
  'Tinh dầu',
  'Nến thơm',
  'Sổ viết',
  'Bộ thư giãn',
  'Âm thanh',
];

export const shopProducts: ShopProduct[] = [
  {
    id: 'oil-lavender-night',
    slug: 'tinh-dau-lavender-dem-yen',
    name: 'Tinh dầu Lavender Đêm Yên',
    category: 'Tinh dầu',
    price: 189000,
    oldPrice: 229000,
    description:
      'Mùi lavender dịu nhẹ cho những buổi tối cần hạ nhịp, phù hợp khuếch tán trước khi ngủ hoặc khi đọc sách.',
    details: ['Dung tích 15ml', 'Hương lavender, gỗ tuyết tùng', 'Dùng với máy khuếch tán hoặc đá thơm'],
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=900&auto=format&fit=crop&q=80',
    ],
    tags: ['Ngủ ngon', 'Dịu nhẹ'],
    stock: 24,
    rating: 4.8,
  },
  {
    id: 'candle-soft-rain',
    slug: 'nen-thom-mua-em',
    name: 'Nến thơm Mưa Êm',
    category: 'Nến thơm',
    price: 249000,
    description:
      'Nến sáp đậu nành với tầng hương mưa, trà trắng và gỗ ấm, tạo cảm giác căn phòng sạch và yên.',
    details: ['Sáp đậu nành tự nhiên', 'Thời gian cháy 36 giờ', 'Ly thủy tinh tái sử dụng'],
    images: [
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602874801006-2f9487aa5551?w=900&auto=format&fit=crop&q=80',
    ],
    tags: ['Bán chạy', 'Không gian'],
    stock: 16,
    rating: 4.9,
  },
  {
    id: 'journal-kind-words',
    slug: 'so-viet-loi-diu-dang',
    name: 'Sổ viết Lời Dịu Dàng',
    category: 'Sổ viết',
    price: 129000,
    oldPrice: 159000,
    description:
      'Sổ guided journal với prompt ngắn mỗi ngày, giúp bạn ghi lại cảm xúc mà không thấy quá nặng.',
    details: ['120 trang giấy kem', '30 prompt chăm sóc cảm xúc', 'Bìa mềm chống bám bẩn'],
    images: [
      'https://images.unsplash.com/photo-1517842645767-c639042777db?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?w=900&auto=format&fit=crop&q=80',
    ],
    tags: ['Viết cảm xúc', 'Mỗi ngày'],
    stock: 42,
    rating: 4.7,
  },
  {
    id: 'relax-box-weekend',
    slug: 'hop-thu-gian-cuoi-tuan',
    name: 'Hộp thư giãn Cuối Tuần',
    category: 'Bộ thư giãn',
    price: 399000,
    oldPrice: 459000,
    description:
      'Một bộ nhỏ gồm trà thảo mộc, nến mini, đá thơm và thẻ gợi ý thở chậm cho cuối tuần ở nhà.',
    details: ['1 nến mini 80g', '5 gói trà hoa cúc', '1 đá thơm ceramic', '12 thẻ chăm sóc bản thân'],
    images: [
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80',
    ],
    tags: ['Quà tặng', 'Combo'],
    stock: 10,
    rating: 4.9,
  },
  {
    id: 'sound-card-forest',
    slug: 'the-am-thanh-rung-nho',
    name: 'Thẻ âm thanh Rừng Nhỏ',
    category: 'Âm thanh',
    price: 99000,
    description:
      'Thẻ QR mở playlist âm thanh thiên nhiên được tuyển chọn cho 7 buổi nghỉ ngơi ngắn.',
    details: ['7 track thiên nhiên', 'Mỗi track 20-40 phút', 'Tặng kèm hướng dẫn nghe chậm'],
    images: [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&auto=format&fit=crop&q=80',
    ],
    tags: ['Digital', 'Thiên nhiên'],
    stock: 99,
    rating: 4.6,
  },
  {
    id: 'tea-calm-set',
    slug: 'tra-thao-moc-ngoi-xuong-thoi',
    name: 'Trà thảo mộc Ngồi Xuống Thôi',
    category: 'Bộ thư giãn',
    price: 169000,
    description:
      'Trà hoa cúc, bạc hà và táo đỏ, hợp với những lúc cần một khoảng dừng nhẹ giữa ngày.',
    details: ['12 túi lọc', 'Không caffeine', 'Hương thảo mộc thanh nhẹ'],
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=900&auto=format&fit=crop&q=80',
    ],
    tags: ['Không caffeine', 'Ấm bụng'],
    stock: 31,
    rating: 4.8,
  },
];

export function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getProductBySlug(slug: string) {
  return shopProducts.find((product) => product.slug === slug);
}
