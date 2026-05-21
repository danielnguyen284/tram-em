-- Migration to add sales_count column to products table
alter table products add column if not exists sales_count integer not null default 0;
