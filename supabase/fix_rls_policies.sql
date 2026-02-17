-- Drop existing policies to recreate them safely
drop policy if exists "Enable read for authenticated users" on stores;
drop policy if exists "Enable all for authenticated users" on inventory_levels;

-- Stores: Authenticated users can read. Admins can do all (just in case).
create policy "Enable read for authenticated users" on stores
  for select using (auth.role() = 'authenticated');

create policy "Enable all for admins" on stores
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Inventory Levels: Authenticated users can do everything (insert, update, select)
create policy "Enable all for authenticated users" on inventory_levels
  for all using (auth.role() = 'authenticated');

-- Verify products policy exists (it should, but ensuring no regression)
-- (No action needed as schema.sql covers it, but good to keep in mind)
