-- Community moderation status and configurable sensitive-word filters.

alter table posts add column if not exists moderation_status text not null default 'approved';
alter table posts add column if not exists moderation_reason text;
alter table posts add column if not exists moderation_matches text[] not null default '{}';
alter table posts add column if not exists reviewed_by uuid references profiles(id) on delete set null;
alter table posts add column if not exists reviewed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_moderation_status_check'
  ) then
    alter table posts add constraint posts_moderation_status_check
      check (moderation_status in ('approved', 'pending_review', 'rejected'));
  end if;
end $$;

update posts set moderation_status = 'approved' where moderation_status is null;

drop policy if exists "Posts viewable by everyone" on posts;
create policy "Approved posts viewable by everyone" on posts
  for select using (moderation_status = 'approved');

create index if not exists posts_moderation_status_created_at_idx
  on posts (moderation_status, created_at desc);

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

insert into community_moderation_terms (term, action) values
  ('spam', 'block'),
  ('scam', 'block'),
  ('lừa đảo', 'block'),
  ('tự tử', 'review'),
  ('tự hại', 'review'),
  ('muốn chết', 'review')
on conflict (term, action) do nothing;
