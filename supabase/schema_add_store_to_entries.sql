-- Add store_id to stock_entries
alter table stock_entries add column if not exists store_id uuid references stores(id) on delete cascade;

-- Optional: index for performance
create index if not exists idx_stock_entries_store_id on stock_entries(store_id);
