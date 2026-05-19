-- Support one-level threaded replies in community comments.

alter table comments add column if not exists parent_id uuid references comments(id) on delete cascade;

create index if not exists comments_post_parent_created_at_idx
  on comments (post_id, parent_id, created_at);
