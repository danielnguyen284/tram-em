-- ============================================================
-- Trạm Êm — Supabase Schema Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─── Profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
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
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Products (Shop) ─────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
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
  author_id uuid references auth.users(id) on delete cascade,
  content text not null,
  image_url text,
  tags text[] default '{}',
  likes_count integer default 0,
  reposts_count integer default 0,
  created_at timestamptz default now()
);

alter table posts enable row level security;
create policy "Posts viewable by everyone" on posts for select using (true);
create policy "Auth users create posts" on posts for insert with check (auth.uid() = author_id);
create policy "Authors delete own posts" on posts for delete using (auth.uid() = author_id);

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
  author_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table comments enable row level security;
create policy "Comments viewable by everyone" on comments for select using (true);
create policy "Auth users create comments" on comments for insert with check (auth.uid() = author_id);
create policy "Authors delete own comments" on comments for delete using (auth.uid() = author_id);

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
create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();
create trigger shipping_addresses_updated_at before update on shipping_addresses
  for each row execute function update_updated_at();
create trigger chat_threads_updated_at before update on chat_threads
  for each row execute function update_updated_at();
create trigger cart_items_updated_at before update on cart_items
  for each row execute function update_updated_at();
