-- Dynamic Categories Schema

-- 1. Create Categories Table (Groups)
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Subcategories Table (Categories in CSV)
create table subcategories (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references categories(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(category_id, name)
);

-- 3. Update Products Table
-- We will add the columns first, then data import will fill them.
-- Eventually we might drop the old 'category' column, or keep it for legacy/backup.
alter table products add column category_id uuid references categories(id) on delete set null;
alter table products add column subcategory_id uuid references subcategories(id) on delete set null;

-- RLS
alter table categories enable row level security;
alter table subcategories enable row level security;

create policy "Enable all for authenticated users" on categories
  for all using (auth.role() = 'authenticated');

create policy "Enable all for authenticated users" on subcategories
  for all using (auth.role() = 'authenticated');
