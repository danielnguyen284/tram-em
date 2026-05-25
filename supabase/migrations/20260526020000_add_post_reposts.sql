create table if not exists public.post_reposts (
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

alter table public.post_reposts enable row level security;

drop policy if exists "Reposts viewable by everyone" on public.post_reposts;
create policy "Reposts viewable by everyone" on public.post_reposts
  for select using (true);

drop policy if exists "Auth users can repost others" on public.post_reposts;
create policy "Auth users can repost others" on public.post_reposts
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.posts
      where posts.id = post_id
        and posts.author_id <> auth.uid()
        and posts.moderation_status = 'approved'
    )
  );

drop policy if exists "Auth users can undo repost" on public.post_reposts;
create policy "Auth users can undo repost" on public.post_reposts
  for delete using (auth.uid() = user_id);

create or replace function public.update_post_reposts_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set reposts_count = reposts_count + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.posts set reposts_count = greatest(reposts_count - 1, 0) where id = OLD.post_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_repost_change on public.post_reposts;
create trigger on_post_repost_change
  after insert or delete on public.post_reposts
  for each row execute function public.update_post_reposts_count();

update public.posts p
set reposts_count = coalesce(r.total, 0)
from (
  select post_id, count(*)::integer as total
  from public.post_reposts
  group by post_id
) r
where p.id = r.post_id;
