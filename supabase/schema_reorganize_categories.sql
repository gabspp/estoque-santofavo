-- ============================================================
-- Migration: Reorganize Categories
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- STEP 1: Merge duplicate "1-Insumos" / "1- Insumos" into one row
-- (the CSV had inconsistent naming)
DO $$
DECLARE
  main_id uuid;
  dupe_id uuid;
BEGIN
  SELECT id INTO main_id FROM categories WHERE name = '1- Insumos' LIMIT 1;
  SELECT id INTO dupe_id FROM categories WHERE name = '1-Insumos' LIMIT 1;

  IF main_id IS NOT NULL AND dupe_id IS NOT NULL THEN
    UPDATE subcategories SET category_id = main_id WHERE category_id = dupe_id;
    UPDATE products     SET category_id = main_id WHERE category_id = dupe_id;
    DELETE FROM categories WHERE id = dupe_id;
  END IF;
END $$;

-- STEP 2: Rename existing categories to the new names
-- Using ILIKE to catch all spacing variants: "1 - Insumos", "1- Insumos", "1-Insumos"
UPDATE categories SET name = 'Insumos (Confeitaria)'
  WHERE name ILIKE '%insumo%'
  AND name NOT ILIKE '%salgado%'
  AND name NOT ILIKE '%bar%'
  AND name != 'Insumos (Confeitaria)';
UPDATE categories SET name = 'Embalagens'             WHERE name IN ('2 - Embalagens', '2- Embalagens');
UPDATE categories SET name = 'Material de Consumo'    WHERE name IN ('3- Material de Consumo', '3 - Material de Consumo');
UPDATE categories SET name = 'Material de Apoio'      WHERE name IN ('4- Material de Apoio', '4 - Material de Apoio');

-- STEP 3: Insert new categories (Salgados and Bar)
INSERT INTO categories (name) VALUES ('Insumos (Salgados)') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Insumos (Bar)')      ON CONFLICT (name) DO NOTHING;

-- STEP 4: Sync the legacy `category` text field and `category_id` on products
UPDATE products
SET category    = 'Insumos (Confeitaria)',
    category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)')
WHERE category ILIKE '%insumo%'
  AND category NOT ILIKE '%salgado%'
  AND category NOT ILIKE '%bar%'
  AND category != 'Insumos (Confeitaria)';

UPDATE products
SET category    = 'Embalagens',
    category_id = (SELECT id FROM categories WHERE name = 'Embalagens')
WHERE category IN ('2 - Embalagens', '2- Embalagens');

UPDATE products
SET category    = 'Material de Consumo',
    category_id = (SELECT id FROM categories WHERE name = 'Material de Consumo')
WHERE category IN ('3- Material de Consumo', '3 - Material de Consumo');

UPDATE products
SET category    = 'Material de Apoio',
    category_id = (SELECT id FROM categories WHERE name = 'Material de Apoio')
WHERE category IN ('4- Material de Apoio', '4 - Material de Apoio');

-- STEP 5 (verification) — run these SELECTs to confirm the result
-- SELECT name FROM categories ORDER BY name;
-- SELECT category, count(*) FROM products GROUP BY category ORDER BY category;
