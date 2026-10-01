-- Fix discount_rules RLS policies to allow anon role (admin uses anon key, no Supabase auth)
DROP POLICY IF EXISTS "select_discount_rules" ON store_discount_rules;
DROP POLICY IF EXISTS "insert_discount_rules" ON store_discount_rules;
DROP POLICY IF EXISTS "update_discount_rules" ON store_discount_rules;
DROP POLICY IF EXISTS "delete_discount_rules" ON store_discount_rules;

CREATE POLICY "select_discount_rules" ON store_discount_rules FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_discount_rules" ON store_discount_rules FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_discount_rules" ON store_discount_rules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_discount_rules" ON store_discount_rules FOR DELETE
  TO anon, authenticated USING (true);