export type GameMeta = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  href: string;
};

export const gameCategories = ['Tất cả', 'Vui nhộn', 'Thư giãn', 'Sáng tạo', 'Tập trung', 'Phản xạ'];

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
    id: 'pebble-sort',
    title: 'Sắp xếp sỏi',
    description: 'Đổi vị trí những viên sỏi màu, thiền theo nhịp chuyển động nhẹ nhàng.',
    category: 'Thư giãn',
    image: '/images/game-pebble-sort.png',
    href: '/games/pebble-sort',
  },
  {
    id: '2048',
    title: '2048',
    description: 'Ghép các ô số cùng giá trị, giữ nhịp suy nghĩ chậm và rõ ràng.',
    category: 'Tập trung',
    image: '/images/game-2048.svg',
    href: '/games/2048',
  },
  {
    id: 'snake',
    title: 'Rắn săn mồi',
    description: 'Dẫn đường thật mượt, ăn mồi và giữ bình tĩnh khi tốc độ tăng dần.',
    category: 'Phản xạ',
    image: '/images/game-snake.svg',
    href: '/games/snake',
  },
];
