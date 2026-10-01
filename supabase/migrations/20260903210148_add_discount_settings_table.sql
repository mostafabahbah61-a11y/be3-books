CREATE TABLE IF NOT EXISTS store_discount_settings (
  id int PRIMARY KEY DEFAULT 1,
  min_quantity int NOT NULL DEFAULT 2,
  discount_per_book int NOT NULL DEFAULT 10,
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO store_discount_settings (id, min_quantity, discount_per_book)
VALUES (1, 2, 10)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE store_discount_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_discount_settings" ON store_discount_settings;
DROP POLICY IF EXISTS "insert_discount_settings" ON store_discount_settings;
DROP POLICY IF EXISTS "update_discount_settings" ON store_discount_settings;
DROP POLICY IF EXISTS "delete_discount_settings" ON store_discount_settings;

CREATE POLICY "select_discount_settings" ON store_discount_settings FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_discount_settings" ON store_discount_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_discount_settings" ON store_discount_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_discount_settings" ON store_discount_settings FOR DELETE
  TO anon, authenticated USING (true);