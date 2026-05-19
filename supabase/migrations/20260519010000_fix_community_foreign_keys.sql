-- ─── Fix Posts and Comments Foreign Keys ───

-- 1. Drop existing foreign keys pointing to auth.users
alter table public.posts drop constraint if exists posts_author_id_fkey;
alter table public.comments drop constraint if exists comments_author_id_fkey;

-- 2. Add foreign keys pointing to public.profiles
alter table public.posts
  add constraint posts_author_id_fkey
  foreign key (author_id)
  references public.profiles(id)
  on delete cascade;

alter table public.comments
  add constraint comments_author_id_fkey
  foreign key (author_id)
  references public.profiles(id)
  on delete cascade;
