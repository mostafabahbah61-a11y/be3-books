/*
# Add sort_order to products for custom display ordering

1. Modified Tables
- `store_products` — add `sort_order` integer column (default 0) to control the display order of products on the storefront.
2. Data
- Set sort_order values: level-1 = 1, level-2 = 2, level-3 = 3, complete-set = 4.
3. Security
- No policy changes needed; existing policies cover the new column.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_products' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE store_products ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

UPDATE store_products SET sort_order = 1 WHERE id = 'level-1';
UPDATE store_products SET sort_order = 2 WHERE id = 'level-2';
UPDATE store_products SET sort_order = 3 WHERE id = 'level-3';
UPDATE store_products SET sort_order = 4 WHERE id = 'complete-set';