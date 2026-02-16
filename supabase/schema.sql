-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  barcode text,
  category text not null,
  unit text not null,
  min_stock numeric default 0,
  current_stock numeric default 0,
  last_cost numeric default 0,
  average_cost numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Stock Entries (Purchases/In)
create table stock_entries (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  quantity numeric not null,
  cost_price numeric not null,
  total_cost numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Stock Counts (Inventory Sessions)
create table stock_counts (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('draft', 'pending_review', 'approved', 'rejected')) not null default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Stock Count Items
create table stock_count_items (
  id uuid default uuid_generate_v4() primary key,
  count_id uuid references stock_counts(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  quantity_counted numeric not null,
  quantity_system numeric not null,
  unique(count_id, product_id)
);

-- Weekly Reports
create table weekly_reports (
  id uuid default uuid_generate_v4() primary key,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  total_consumption_value numeric default 0,
  status text default 'closed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Weekly Report Items
create table weekly_report_items (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references weekly_reports(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  product_name text not null, -- Snapshot name
  category text, -- Snapshot category
  unit text, -- Snapshot unit
  initial_stock numeric default 0,
  entries_quantity numeric default 0,
  final_stock numeric default 0,
  consumption_quantity numeric default 0,
  consumption_value numeric default 0
);

-- ROW LEVEL SECURITY (RLS)
alter table products enable row level security;
alter table stock_entries enable row level security;
alter table stock_counts enable row level security;
alter table stock_count_items enable row level security;
alter table weekly_reports enable row level security;
alter table weekly_report_items enable row level security;

-- Policies (Allow all authenticated users to read/write)
-- Products
create policy "Enable all for authenticated users" on products
  for all using (auth.role() = 'authenticated');

-- Stock Entries
create policy "Enable all for authenticated users" on stock_entries
  for all using (auth.role() = 'authenticated');

-- Stock Counts
create policy "Enable all for authenticated users" on stock_counts
  for all using (auth.role() = 'authenticated');

-- Stock Count Items
create policy "Enable all for authenticated users" on stock_count_items
  for all using (auth.role() = 'authenticated');

-- Weekly Reports
create policy "Enable all for authenticated users" on weekly_reports
  for all using (auth.role() = 'authenticated');

-- Weekly Report Items
create policy "Enable all for authenticated users" on weekly_report_items
  for all using (auth.role() = 'authenticated');
