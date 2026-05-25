// ─── Badge Definitions ────────────────────────────────────────────────────────
// Single source of truth for all 12 badges.
// Conditions are evaluated in badge-engine.ts

export type BadgeId =
  | 'first_step'
  | 'storyteller'
  | 'voice_of_ten'
  | 'warm_heart'
  | 'listener'
  | 'breathing_guide'
  | 'game_explorer'
  | 'shopper'
  | 'loyal_shopper'
  | 'ai_friend'
  | 'commenter'
  | 'veteran';

export type Badge = {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  image?: string;
  bgClass: string; // CSS module class name for background
};

export const BADGES: Badge[] = [
  {
    id: 'first_step',
    name: 'Bước Đầu Tiên',
    description: 'Chào mừng đến với Trạm Êm',
    emoji: '🌱',
    image: '/images/badges/first_step.png',
    bgClass: 'badgeBgFirstStep',
  },
  {
    id: 'storyteller',
    name: 'Kể Chuyện',
    description: 'Đã chia sẻ câu chuyện đầu tiên',
    emoji: '📖',
    image: '/images/badges/storyteller.png',
    bgClass: 'badgeBgStoryteller',
  },
  {
    id: 'voice_of_ten',
    name: 'Giọng Của Mười',
    description: 'Đã đăng 10 bài viết cộng đồng',
    emoji: '🎤',
    image: '/images/badges/voice_of_ten.png',
    bgClass: 'badgeBgVoiceOfTen',
  },
  {
    id: 'warm_heart',
    name: 'Trái Tim Ấm',
    description: 'Nhận được 10 lượt thích từ cộng đồng',
    emoji: '💛',
    image: '/images/badges/warm_heart.png',
    bgClass: 'badgeBgWarmHeart',
  },
  {
    id: 'listener',
    name: 'Người Lắng Nghe',
    description: 'Đã khám phá âm thanh thư giãn',
    emoji: '🎧',
    image: '/images/badges/listener.png',
    bgClass: 'badgeBgListener',
  },
  {
    id: 'breathing_guide',
    name: 'Hướng Dẫn Thở',
    description: 'Đã hoàn thành một bài tập thở',
    emoji: '🌬️',
    image: '/images/badges/breathing_guide.png',
    bgClass: 'badgeBgBreathing',
  },
  {
    id: 'game_explorer',
    name: 'Khám Phá Trò Chơi',
    description: 'Đã thử một trò chơi thư giãn',
    emoji: '🎮',
    image: '/images/badges/game_explorer.png',
    bgClass: 'badgeBgGame',
  },
  {
    id: 'shopper',
    name: 'Nhà Mua Sắm',
    description: 'Đã đặt đơn hàng đầu tiên',
    emoji: '🛍️',
    image: '/images/badges/shopper.png',
    bgClass: 'badgeBgShopper',
  },
  {
    id: 'loyal_shopper',
    name: 'Ân Nhân Trạm Êm',
    description: 'Đã đặt 3 đơn hàng hoặc hơn',
    emoji: '💜',
    image: '/images/badges/loyal_shopper.png',
    bgClass: 'badgeBgLoyalShopper',
  },
  {
    id: 'ai_friend',
    name: 'Bạn Của Em AI',
    description: 'Đã trò chuyện cùng Em AI',
    emoji: '🤖',
    image: '/images/badges/ai_friend.png',
    bgClass: 'badgeBgAiFriend',
  },
  {
    id: 'commenter',
    name: 'Người Kết Nối',
    description: 'Đã bình luận trong cộng đồng',
    emoji: '💬',
    image: '/images/badges/commenter.png',
    bgClass: 'badgeBgCommenter',
  },
  {
    id: 'veteran',
    name: 'Lữ Hành Lâu Năm',
    description: 'Đồng hành cùng Trạm Êm từ 30 ngày',
    emoji: '⭐',
    image: '/images/badges/veteran.png',
    bgClass: 'badgeBgVeteran',
  },
];
