-- Migration to add completed_categories to stock_counts

ALTER TABLE stock_counts
ADD COLUMN completed_categories text[] DEFAULT '{}'::text[];
