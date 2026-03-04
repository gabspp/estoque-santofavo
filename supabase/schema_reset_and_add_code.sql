-- ============================================================
-- Migration: Reset tables and add sequential code to products
-- Run in: Supabase Dashboard > SQL Editor
-- WARNING: This DELETES all data in the listed tables.
-- ============================================================

-- STEP 1: Clear dependent tables first (FK order)
TRUNCATE TABLE stock_count_items CASCADE;
TRUNCATE TABLE stock_counts        CASCADE;
TRUNCATE TABLE stock_entries       CASCADE;
TRUNCATE TABLE inventory_levels    CASCADE;
TRUNCATE TABLE products            CASCADE;

-- STEP 2: Add sequential code column to products
CREATE SEQUENCE IF NOT EXISTS products_code_seq START 1;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS code INTEGER UNIQUE DEFAULT nextval('products_code_seq');

-- STEP 3 (verification) — run to confirm
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'products' AND column_name = 'code';
-- SELECT COUNT(*) FROM products;
