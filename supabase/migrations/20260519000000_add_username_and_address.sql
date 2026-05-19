-- ─── Add Username, Address, and Email Columns to Profiles ───

-- 1. Add Columns to Profiles Table
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists email text;

-- 2. Ensure Username is Unique
-- Note: using a unique constraint so users cannot register overlapping usernames
alter table public.profiles add constraint profiles_username_key unique (username);

-- 3. Backfill Existing Users
update public.profiles p
set email = u.email,
    username = coalesce(p.username, split_part(u.email, '@', 1))
from auth.users u
where p.id = u.id;

-- 4. Update the Trigger Function for New User Registrations
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
