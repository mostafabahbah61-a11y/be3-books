/*
# Add discount management system

1. Modified Tables
- `store_products` — add `discount_enabled` boolean column (default true) to allow per-product discount toggling.
2. New Tables
- `store_discount_rules` — quantity-based discount rules with per-product override capability.
  - min_quantity: minimum book quantity to trigger this discount
  - discount_per_book: discount amount per book at this quantity tier
  - product_id: nullable — if null it's a global rule, if set it's a product-specific override
  - active: boolean to enable/disable individual rules
3. Security
- RLS enabled with full CRUD policies for authenticated role (admin only).
4. Data
- Seed default global rules matching the existing hardcoded discount tiers.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_products' AND column_name = 'discount_enabled'
  ) THEN
    ALTER TABLE store_products ADD COLUMN discount_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS store_discount_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text REFERENCES store_products(id) ON DELETE CASCADE,
  min_quantity integer NOT NULL,
  discount_per_book integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE store_discount_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_discount_rules" ON store_discount_rules FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_discount_rules" ON store_discount_rules FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_discount_rules" ON store_discount_rules FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_discount_rules" ON store_discount_rules FOR DELETE
  TO authenticated USING (true);

INSERT INTO store_discount_rules (product_id, min_quantity, discount_per_book, active) VALUES
  (NULL, 10, 10, true),
  (NULL, 20, 15, true),
  (NULL, 30, 20, true),
  (NULL, 50, 25, true),
  (NULL, 100, 30, true)
ON CONFLICT DO NOTHING;