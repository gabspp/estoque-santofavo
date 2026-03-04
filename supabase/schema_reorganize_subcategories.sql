-- ============================================================
-- Migration: Reorganize Subcategories
-- Run AFTER schema_reorganize_categories.sql
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Deduplicate subcategories that became duplicates after
--         the category merge ("1- Insumos" + "1-Insumos" → one)
-- ============================================================
DO $$
DECLARE
  rec RECORD;
  keep_id uuid;
BEGIN
  -- Find subcategories that have duplicates (same category_id + name)
  FOR rec IN
    SELECT category_id, name
    FROM subcategories
    GROUP BY category_id, name
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the oldest one
    SELECT id INTO keep_id
    FROM subcategories
    WHERE category_id = rec.category_id AND name = rec.name
    ORDER BY created_at ASC
    LIMIT 1;

    -- Reassign products from duplicates to the kept one
    UPDATE products
    SET subcategory_id = keep_id
    WHERE subcategory_id IN (
      SELECT id FROM subcategories
      WHERE category_id = rec.category_id AND name = rec.name AND id <> keep_id
    );

    -- Delete the duplicates
    DELETE FROM subcategories
    WHERE category_id = rec.category_id AND name = rec.name AND id <> keep_id;
  END LOOP;
END $$;

-- ============================================================
-- STEP 2: Rename subcategories of "Insumos (Confeitaria)"
--         (remove letter prefixes, rename J - Refrigerados → Hortifruit)
-- ============================================================
UPDATE subcategories SET name = 'Farinhas e Amidos'
  WHERE name = 'A - Farinhas e Amidos'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

UPDATE subcategories SET name = 'Açúcares e Adoçantes'
  WHERE name = 'B - Açúcares e Adoçantes'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

UPDATE subcategories SET name = 'Laticínios e Derivados'
  WHERE name = 'C - Laticínios e Derivados'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

UPDATE subcategories SET name = 'Chocolates e Derivados de Cacau'
  WHERE name = 'D - Chocolates e Derivados de Cacau'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

UPDATE subcategories SET name = 'Aditivos e Auxiliares'
  WHERE name = 'E - Aditivos e Auxiliares'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

UPDATE subcategories SET name = 'Óleos e Gorduras'
  WHERE name = 'F - Óleos e Gorduras'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

UPDATE subcategories SET name = 'Especiarias e Aromatizantes'
  WHERE name = 'G - Especiarias e Aromatizantes'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

UPDATE subcategories SET name = 'Frutas Secas e Oleaginosas'
  WHERE name = 'H - Frutas Secas e Oleaginosas'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

UPDATE subcategories SET name = 'Hortifruit'
  WHERE name = 'J - Refrigerados'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

UPDATE subcategories SET name = 'Outros Insumos de Confeitaria'
  WHERE name = 'I - Outros'
  AND category_id = (SELECT id FROM categories WHERE name = 'Insumos (Confeitaria)');

-- ============================================================
-- STEP 3: Rename subcategories of "Embalagens"
-- ============================================================
UPDATE subcategories SET name = 'Papéis para PDM'
  WHERE name = 'K - Papéis para PDM'
  AND category_id = (SELECT id FROM categories WHERE name = 'Embalagens');

UPDATE subcategories SET name = 'Embalagens para Produtos'
  WHERE name = 'L - Embalagens para Produtos'
  AND category_id = (SELECT id FROM categories WHERE name = 'Embalagens');

UPDATE subcategories SET name = 'Caixas'
  WHERE name = 'M - Caixas'
  AND category_id = (SELECT id FROM categories WHERE name = 'Embalagens');

UPDATE subcategories SET name = 'Sacos e Sacolas'
  WHERE name = 'N - Sacos e Sacolas'
  AND category_id = (SELECT id FROM categories WHERE name = 'Embalagens');

UPDATE subcategories SET name = 'Cordas'
  WHERE name = 'O - Cordas'
  AND category_id = (SELECT id FROM categories WHERE name = 'Embalagens');

UPDATE subcategories SET name = 'Etiquetas'
  WHERE name = 'OA - Etiquetas'
  AND category_id = (SELECT id FROM categories WHERE name = 'Embalagens');

-- ============================================================
-- STEP 4: Rename subcategories of "Material de Consumo"
-- ============================================================
UPDATE subcategories SET name = 'Utensílios de Produção'
  WHERE name = 'P - Utensílios de Produção'
  AND category_id = (SELECT id FROM categories WHERE name = 'Material de Consumo');

UPDATE subcategories SET name = 'Papel'
  WHERE name = 'Q - Papel'
  AND category_id = (SELECT id FROM categories WHERE name = 'Material de Consumo');

UPDATE subcategories SET name = 'Descartáveis'
  WHERE name = 'R - Descartáveis'
  AND category_id = (SELECT id FROM categories WHERE name = 'Material de Consumo');

-- ============================================================
-- STEP 5: Rename subcategories of "Material de Apoio"
-- ============================================================
UPDATE subcategories SET name = 'Material de Escritório/Diversos'
  WHERE name = 'S - Material de Escritório/Diversos'
  AND category_id = (SELECT id FROM categories WHERE name = 'Material de Apoio');

UPDATE subcategories SET name = 'Material de Limpeza'
  WHERE name = 'T - Material de Limpeza'
  AND category_id = (SELECT id FROM categories WHERE name = 'Material de Apoio');

UPDATE subcategories SET name = 'Outros'
  WHERE name = 'I - Outros'
  AND category_id = (SELECT id FROM categories WHERE name = 'Material de Apoio');

-- ============================================================
-- STEP 6: Insert new subcategories for "Insumos (Salgados)"
-- ============================================================
INSERT INTO subcategories (category_id, name)
SELECT id, unnest(ARRAY[
  'Insumos para Panificação',
  'Queijos e Laticínios',
  'Ervas e Legumes',
  'Proteínas',
  'Mercearia e Temperos',
  'Outros Insumos de Salgados'
])
FROM categories WHERE name = 'Insumos (Salgados)'
ON CONFLICT (category_id, name) DO NOTHING;

-- ============================================================
-- STEP 7: Insert new subcategories for "Insumos (Bar)"
-- ============================================================
INSERT INTO subcategories (category_id, name)
SELECT id, unnest(ARRAY[
  'Bebidas Para Revenda',
  'Saches',
  'Leites',
  'Bases e Ingredientes',
  'Outros Insumos para Bar'
])
FROM categories WHERE name = 'Insumos (Bar)'
ON CONFLICT (category_id, name) DO NOTHING;

-- ============================================================
-- STEP 8 (verification) — run these to confirm
-- ============================================================
-- SELECT c.name as categoria, s.name as subcategoria
-- FROM subcategories s JOIN categories c ON c.id = s.category_id
-- ORDER BY c.name, s.name;
