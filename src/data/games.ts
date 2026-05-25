export type GameMeta = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  href: string;
};

export const gameCategories = ['Tất cả', 'Vui nhộn', 'Sáng tạo', 'Tập trung', 'Chữa lành', 'Action nhẹ'];

export const games: GameMeta[] = [
  {
    id: 'balloon-pop',
    title: 'Bóp bóng bay',
    description: 'Bóp từng quả bóng, thả lỏng căng thẳng theo từng tiếng pop nhẹ nhàng.',
    category: 'Vui nhộn',
    image: '/images/game-balloon-pop.png',
    href: '/games/balloon-pop',
  },
  {
    id: 'sand-draw',
    title: 'Vẽ trên cát',
    description: 'Vẽ tự do trên cát ấm, nghe tiếng xào xạc và để tâm trí bay bổng.',
    category: 'Sáng tạo',
    image: '/images/game-sand-draw.png',
    href: '/games/sand-draw',
  },
  {
    id: '2048',
    title: '2048',
    description: 'Ghép các ô số cùng giá trị, giữ nhịp suy nghĩ chậm và rõ ràng.',
    category: 'Tập trung',
    image: '/images/game-2048.png',
    href: '/games/2048',
  },
  {
    id: 'tear-garden',
    title: 'Đỡ Giọt Nước Mắt',
    description: 'Hứng những giọt nước mắt bằng chiếc lá êm, gom đủ yêu thương để tạo thành vườn hoa nhỏ.',
    category: 'Chữa lành',
    image: '/images/game-tear-garden.png',
    href: '/games/tear-garden',
  },
  {
    id: 'calm-lights',
    title: 'Bấm Đèn Bình Tĩnh',
    description: 'Nhấn đúng chiếc đèn đang sáng theo nhịp để thắp sáng căn phòng ấm áp và giữ tâm trí bình tĩnh.',
    category: 'Tập trung',
    image: '/images/game-calm-lights.png',
    href: '/games/calm-lights',
  },
  {
    id: 'flower-pick',
    title: 'Nhặt Hoa Bình Yên',
    description: 'Chạm vào những bông hoa pastel trước khi chúng tàn, tránh cỏ gai và mây xám để tạo bó hoa cuối game.',
    category: 'Vui nhộn',
    image: '/images/game-flower-pick.png',
    href: '/games/flower-pick',
  },
];
