-- Manage shop categories separately from individual product rows.

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text unique not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.product_categories enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_categories'
      and policyname = 'Product categories viewable by everyone'
  ) then
    create policy "Product categories viewable by everyone"
      on public.product_categories
      for select
      using (is_active = true);
  end if;
end $$;

insert into public.product_categories (name, slug, sort_order)
select
  category,
  lower(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g')),
  row_number() over (order by category)
from (
  select distinct trim(category) as category
  from public.products
  where trim(category) <> ''
) existing_categories
on conflict (name) do nothing;

alter table public.products
  add column if not exists category_id uuid references public.product_categories(id) on delete set null;

update public.products p
set category_id = c.id
from public.product_categories c
where p.category_id is null
  and p.category = c.name;

drop trigger if exists product_categories_updated_at on public.product_categories;
create trigger product_categories_updated_at before update on public.product_categories
  for each row execute function update_updated_at();
