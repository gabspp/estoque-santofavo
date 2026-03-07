-- Add to_buy flag to stock_count_items
-- This allows users to mark items as "needs purchasing" during counting

ALTER TABLE stock_count_items
  ADD COLUMN IF NOT EXISTS to_buy boolean NOT NULL DEFAULT false;
