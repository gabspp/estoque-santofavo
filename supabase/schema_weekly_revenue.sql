-- Faturamento semanal (entrada manual — não há API)
create table if not exists weekly_revenue (
  id uuid default uuid_generate_v4() primary key,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  revenue_marketup numeric default 0 not null,
  revenue_takeat_248 numeric default 0 not null,
  revenue_takeat_26 numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(start_date, end_date)
);

alter table weekly_revenue enable row level security;

-- Policies for weekly_revenue
drop policy if exists "Enable all for authenticated users" on weekly_revenue;
create policy "Enable all for authenticated users" on weekly_revenue
  for all using (auth.role() = 'authenticated');

-- Snapshot do faturamento no fechamento (pra histórico de CMV)
alter table weekly_reports
  add column if not exists revenue_total numeric default 0;
