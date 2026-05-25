alter table public.posts
  add column if not exists updated_at timestamptz default now();

update public.posts
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

drop policy if exists "Authors update own posts" on public.posts;
create policy "Authors update own posts" on public.posts
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function update_updated_at();
