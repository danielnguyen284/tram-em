// Database row types matching Supabase schema

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  description: string;
  details: string[];
  images: string[];
  tags: string[];
  stock: number;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Sound = {
  id: string;
  name: string;
  category: string;
  mood: string | null;
  duration: string | null;
  icon: string | null;
  image_url: string | null;
  audio_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string | null;
  content: string;
  image_url: string | null;
  tags: string[];
  likes_count: number;
  reposts_count: number;
  moderation_status: 'approved' | 'pending_review' | 'rejected';
  moderation_reason: string | null;
  moderation_matches: string[];
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Joined fields
  author?: Profile;
  comments_count?: number;
  liked_by_user?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string | null;
  parent_id: string | null;
  content: string;
  created_at: string;
  // Joined
  author?: Profile;
};

export type PopularTag = {
  tag: string;
  posts_count: number;
  hot_score: number;
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role?: 'admin' | 'customer' | null;
  phone?: string | null;
  gender?: string | null;
  username?: string | null;
  address?: string | null;
  email?: string | null;
  created_at: string;
};

export type MediaAsset = {
  id: string;
  source: 'product' | 'sound' | 'storage';
  title: string;
  type: 'image' | 'audio' | 'file';
  url: string;
  created_at?: string | null;
};

export type CommunityModerationTerm = {
  id: string;
  term: string;
  action: 'block' | 'review';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatThread = {
  id: string;
  user_id: string;
  title: string;
  topic: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  last_message?: ChatMessage;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  icon: string;
  title: string;
  body: string;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string | null;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'expired' | 'failed' | 'manual_review';
  payment_method: string;
  payment_code: string | null;
  payment_amount: number;
  payment_reference: string | null;
  paid_at: string | null;
  expires_at: string | null;
  total: number;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
};

export type ShippingAddress = {
  id: string;
  user_id: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
};

export type SepayTransaction = {
  id: string;
  sepay_transaction_id: number;
  order_id: string | null;
  gateway: string | null;
  transaction_date: string | null;
  account_number: string | null;
  sub_account: string | null;
  payment_code: string | null;
  content: string | null;
  transfer_type: string | null;
  description: string | null;
  transfer_amount: number;
  accumulated: number;
  reference_code: string | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Joined
  product?: Product;
};
