-- ============================================================
-- Trạm Êm — Supabase Schema Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─── Profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  phone text,
  gender text,
  username text unique,
  address text,
  email text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Profiles viewable by everyone" on profiles for select using (true);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, phone, gender, email, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'gender',
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Products (Shop) ─────────────────────────────────────────
create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text unique not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table product_categories enable row level security;
create policy "Product categories viewable by everyone" on product_categories for select using (is_active = true);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category_id uuid references product_categories(id) on delete set null,
  category text not null,
  price integer not null,
  old_price integer,
  description text not null,
  details text[] default '{}',
  images text[] default '{}',
  tags text[] default '{}',
  stock integer not null default 0,
  rating numeric(2,1) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table products enable row level security;
create policy "Products viewable by everyone" on products for select using (is_active = true);

-- ─── Sounds (Soundscape) ────────────────────────────────────
create table if not exists sounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  mood text,
  duration text,
  icon text,
  image_url text,
  audio_url text not null,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table sounds enable row level security;
create policy "Sounds viewable by everyone" on sounds for select using (is_active = true);

-- ─── Posts (Community) ───────────────────────────────────────
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  image_url text,
  tags text[] default '{}',
  likes_count integer default 0,
  reposts_count integer default 0,
  comments_count integer default 0,
  moderation_status text not null default 'approved' check (moderation_status in ('approved', 'pending_review', 'rejected')),
  moderation_reason text,
  moderation_matches text[] not null default '{}',
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

alter table posts enable row level security;
create policy "Approved posts viewable by everyone" on posts for select using (moderation_status = 'approved');
create policy "Auth users create posts" on posts for insert with check (auth.uid() = author_id);
create policy "Authors delete own posts" on posts for delete using (auth.uid() = author_id);

create index if not exists posts_moderation_status_created_at_idx
  on posts (moderation_status, created_at desc);

-- ─── Post Likes ──────────────────────────────────────────────
create table if not exists post_likes (
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

alter table post_likes enable row level security;
create policy "Likes viewable by everyone" on post_likes for select using (true);
create policy "Auth users can like" on post_likes for insert with check (auth.uid() = user_id);
create policy "Auth users can unlike" on post_likes for delete using (auth.uid() = user_id);

-- Trigger to update likes_count on posts
create or replace function update_post_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update posts set likes_count = likes_count - 1 where id = OLD.post_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_like_change on post_likes;
create trigger on_post_like_change
  after insert or delete on post_likes
  for each row execute function update_post_likes_count();

-- ─── Comments ────────────────────────────────────────────────
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  likes_count integer default 0,
  created_at timestamptz default now()
);

alter table comments enable row level security;
create policy "Comments viewable by everyone" on comments for select using (true);
create policy "Auth users create comments" on comments for insert with check (auth.uid() = author_id);
create policy "Authors delete own comments" on comments for delete using (auth.uid() = author_id);

create index if not exists comments_post_parent_created_at_idx
  on comments (post_id, parent_id, created_at);

-- Trigger to update comments_count on posts
create or replace function update_post_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update posts set comments_count = comments_count - 1 where id = OLD.post_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_comment_change on comments;
create trigger on_post_comment_change
  after insert or delete on comments
  for each row execute function update_post_comments_count();

-- ─── Comment Likes ──────────────────────────────────────────
create table if not exists comment_likes (
  comment_id uuid references comments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (comment_id, user_id)
);

alter table comment_likes enable row level security;
create policy "Comment likes viewable by everyone" on comment_likes for select using (true);
create policy "Auth users like comment" on comment_likes for insert with check (auth.uid() = user_id);
create policy "Auth users unlike comment" on comment_likes for delete using (auth.uid() = user_id);

-- Trigger to update likes_count on comments
create or replace function update_comment_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update comments set likes_count = likes_count + 1 where id = NEW.comment_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update comments set likes_count = likes_count - 1 where id = OLD.comment_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_like_change on comment_likes;
create trigger on_comment_like_change
  after insert or delete on comment_likes
  for each row execute function update_comment_likes_count();


-- Function to get posts sorted by viral score (Hacker News algorithm)
create or replace function get_viral_posts(
  offset_num int default 0,
  limit_num int default 10,
  tag_filter text default null
)
returns setof posts
language plpgsql
security definer
as $$
begin
  return query
  select p.*
  from posts p
  where p.moderation_status = 'approved'
    and (tag_filter is null or tag_filter = any(p.tags))
  order by 
    (p.likes_count + p.comments_count * 2.0) / 
    power(extract(epoch from (now() - p.created_at))/3600.0 + 2, 1.8) desc
  limit limit_num
  offset offset_num;
end;
$$;

-- ─── Community Moderation Terms ──────────────────────────────
create table if not exists community_moderation_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  action text not null check (action in ('block', 'review')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term, action)
);

alter table community_moderation_terms enable row level security;

create index if not exists community_moderation_terms_active_idx
  on community_moderation_terms (is_active, action);

-- ─── Chat Threads (AI) ──────────────────────────────────────
create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Cuộc trò chuyện mới',
  topic text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table chat_threads enable row level security;
create policy "Users see own threads" on chat_threads for select using (auth.uid() = user_id);
create policy "Users create own threads" on chat_threads for insert with check (auth.uid() = user_id);
create policy "Users update own threads" on chat_threads for update using (auth.uid() = user_id);
create policy "Users delete own threads" on chat_threads for delete using (auth.uid() = user_id);

-- ─── Chat Messages ──────────────────────────────────────────
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references chat_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table chat_messages enable row level security;
create policy "Users see own messages" on chat_messages for select
  using (exists (
    select 1 from chat_threads where id = chat_messages.thread_id and user_id = auth.uid()
  ));
create policy "Users create own messages" on chat_messages for insert
  with check (exists (
    select 1 from chat_threads where id = chat_messages.thread_id and user_id = auth.uid()
  ));

-- ─── Notifications ──────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  icon text not null default 'bell',
  title text not null,
  body text not null,
  href text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;
create policy "Users see own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users mark read" on notifications for update using (auth.uid() = user_id);

-- ─── Orders ─────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'expired', 'failed', 'manual_review')),
  payment_method text not null default 'sepay',
  payment_code text unique,
  payment_amount integer not null default 0,
  payment_reference text,
  paid_at timestamptz,
  expires_at timestamptz,
  total integer not null default 0,
  shipping_name text,
  shipping_phone text,
  shipping_address text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table orders enable row level security;
create policy "Users see own orders" on orders for select using (auth.uid() = user_id);
create policy "Users create own orders" on orders for insert with check (auth.uid() = user_id);

-- Safe upgrades for existing databases that already have orders.
alter table orders add column if not exists payment_status text not null default 'pending';
alter table orders add column if not exists payment_method text not null default 'sepay';
alter table orders add column if not exists payment_code text unique;
alter table orders add column if not exists payment_amount integer not null default 0;
alter table orders add column if not exists payment_reference text;
alter table orders add column if not exists paid_at timestamptz;
alter table orders add column if not exists expires_at timestamptz;

-- ─── Order Items ─────────────────────────────────────────────
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_image text,
  price integer not null,
  quantity integer not null default 1
);

alter table order_items enable row level security;
create policy "Users see own order items" on order_items for select
  using (exists (
    select 1 from orders where id = order_items.order_id and user_id = auth.uid()
  ));
create policy "Users create own order items" on order_items for insert
  with check (exists (
    select 1 from orders where id = order_items.order_id and user_id = auth.uid()
  ));

-- ─── Saved Shipping Address ─────────────────────────────────
create table if not exists shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shipping_name text not null,
  shipping_phone text not null,
  shipping_address text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

alter table shipping_addresses enable row level security;
create policy "Users see own shipping address" on shipping_addresses for select using (auth.uid() = user_id);
create policy "Users create own shipping address" on shipping_addresses for insert with check (auth.uid() = user_id);
create policy "Users update own shipping address" on shipping_addresses for update using (auth.uid() = user_id);

-- ─── SePay Transactions ─────────────────────────────────────
create table if not exists sepay_transactions (
  id uuid primary key default gen_random_uuid(),
  sepay_transaction_id bigint unique not null,
  order_id uuid references orders(id) on delete set null,
  gateway text,
  transaction_date text,
  account_number text,
  sub_account text,
  payment_code text,
  content text,
  transfer_type text,
  description text,
  transfer_amount integer not null default 0,
  accumulated integer not null default 0,
  reference_code text,
  raw_payload jsonb not null,
  created_at timestamptz default now()
);

alter table sepay_transactions enable row level security;

-- ─── Cart Items (Synced for logged-in users) ─────────────────
create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, product_id)
);

alter table cart_items enable row level security;
create policy "Users see own cart" on cart_items for select using (auth.uid() = user_id);
create policy "Users manage own cart" on cart_items for insert with check (auth.uid() = user_id);
create policy "Users update own cart" on cart_items for update using (auth.uid() = user_id);
create policy "Users delete own cart" on cart_items for delete using (auth.uid() = user_id);

-- ─── Helper: updated_at trigger ─────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger products_updated_at before update on products
  for each row execute function update_updated_at();
create trigger product_categories_updated_at before update on product_categories
  for each row execute function update_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();
create trigger shipping_addresses_updated_at before update on shipping_addresses
  for each row execute function update_updated_at();
create trigger chat_threads_updated_at before update on chat_threads
  for each row execute function update_updated_at();
create trigger cart_items_updated_at before update on cart_items
  for each row execute function update_updated_at();
create trigger community_moderation_terms_updated_at before update on community_moderation_terms
  for each row execute function update_updated_at();
