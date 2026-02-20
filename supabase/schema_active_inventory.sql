-- Add is_active column to inventory_levels to track if a product is active in a specific store
alter table inventory_levels
add column if not exists is_active boolean default true not null;
