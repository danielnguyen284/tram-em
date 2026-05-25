-- Migration: Add user_badges and user_activity_logs for dynamic badge system

create table if not exists user_badges (
  user_id    uuid references auth.users(id) on delete cascade,
  badge_id   text not null,
  earned_at  timestamptz default now(),
  primary key (user_id, badge_id)
);

alter table user_badges enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='user_badges' and policyname='Users see own badges') then
    create policy "Users see own badges" on user_badges for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='user_badges' and policyname='Service role insert badges') then
    create policy "Service role insert badges" on user_badges for insert with check (true);
  end if;
end $$;

-- One row per (user_id, activity_type) — idempotent primary key
-- Valid activity_type: 'soundscape_play', 'breathing_complete', 'game_play'
create table if not exists user_activity_logs (
  user_id        uuid references auth.users(id) on delete cascade,
  activity_type  text not null,
  logged_at      timestamptz default now(),
  primary key (user_id, activity_type)
);

alter table user_activity_logs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='user_activity_logs' and policyname='Users see own activity logs') then
    create policy "Users see own activity logs" on user_activity_logs for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='user_activity_logs' and policyname='Users insert own activity logs') then
    create policy "Users insert own activity logs" on user_activity_logs for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='user_activity_logs' and policyname='Users upsert own activity logs') then
    create policy "Users upsert own activity logs" on user_activity_logs for update using (auth.uid() = user_id);
  end if;
end $$;
