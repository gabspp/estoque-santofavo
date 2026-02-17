-- Create stores table
create table if not exists stores (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed stores
insert into stores (name, code) values
  ('Loja 26', '26'),
  ('Loja 248', '248')
on conflict (code) do nothing;

-- Create inventory_levels table
create table if not exists inventory_levels (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  store_id uuid references stores(id) on delete cascade not null,
  quantity numeric default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, store_id)
);

-- Add store_id to stock_counts
alter table stock_counts add column if not exists store_id uuid references stores(id) on delete cascade;

-- RLS Policies
alter table stores enable row level security;
alter table inventory_levels enable row level security;

-- Stores: Read-only for authenticated users (or all access if needed, keeping it simple)
create policy "Enable read for authenticated users" on stores
  for select using (auth.role() = 'authenticated');

-- Inventory Levels: Full access for authenticated users (similar to other tables)
create policy "Enable all for authenticated users" on inventory_levels
  for all using (auth.role() = 'authenticated');
