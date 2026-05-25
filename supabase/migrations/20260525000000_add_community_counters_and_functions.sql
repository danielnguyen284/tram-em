-- ─── Add missing community columns, tables, triggers and functions ───

-- 1. Add comments_count to posts
alter table public.posts add column if not exists comments_count integer default 0;

-- 2. Add likes_count to comments
alter table public.comments add column if not exists likes_count integer default 0;

-- 3. Create update_post_comments_count function and trigger
create or replace function public.update_post_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.posts set comments_count = comments_count - 1 where id = OLD.post_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_comment_change on public.comments;
create trigger on_post_comment_change
  after insert or delete on public.comments
  for each row execute function public.update_post_comments_count();

-- 4. Create comment_likes table
create table if not exists public.comment_likes (
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

-- Policies for comment_likes
drop policy if exists "Comment likes viewable by everyone" on public.comment_likes;
create policy "Comment likes viewable by everyone" on public.comment_likes
  for select using (true);

drop policy if exists "Auth users like comment" on public.comment_likes;
create policy "Auth users like comment" on public.comment_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Auth users unlike comment" on public.comment_likes;
create policy "Auth users unlike comment" on public.comment_likes
  for delete using (auth.uid() = user_id);

-- 5. Create update_comment_likes_count function and trigger
create or replace function public.update_comment_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.comments set likes_count = likes_count + 1 where id = NEW.comment_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.comments set likes_count = likes_count - 1 where id = OLD.comment_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_like_change on public.comment_likes;
create trigger on_comment_like_change
  after insert or delete on public.comment_likes
  for each row execute function public.update_comment_likes_count();

-- 6. Create get_viral_posts function
create or replace function public.get_viral_posts(
  offset_num int default 0,
  limit_num int default 10,
  tag_filter text default null
)
returns setof public.posts
language plpgsql
security definer
as $$
begin
  return query
  select p.*
  from public.posts p
  where p.moderation_status = 'approved'
    and (tag_filter is null or tag_filter = any(p.tags))
  order by 
    (p.likes_count + p.comments_count * 2.0) / 
    power(extract(epoch from (now() - p.created_at))/3600.0 + 2, 1.8) desc
  limit limit_num
  offset offset_num;
end;
$$;
