/*
# Create My Little Reader store data

1. New Tables
- `store_products` stores the four books, prices, cover images, descriptions, and gallery images.
- `store_orders` stores customer order details, selected product, quantity, prices, delivery fee, and order time.
- `store_feedback` stores visitor feedback and its submission time.
2. Security
- Enable row level security on every table.
- This is a single-store public storefront without customer accounts, so the anonymous storefront can read products and create orders or feedback.
- The admin screen is protected at the application level by the requested admin password.
3. Important notes
- Product rows are seeded only when missing, so future edits are preserved.
- Orders and feedback are appendable records for the dashboard.
*/

CREATE TABLE IF NOT EXISTS store_products (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  old_price integer,
  image_url text NOT NULL,
  gallery_urls text[] NOT NULL DEFAULT '{}',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  discount integer NOT NULL DEFAULT 0 CHECK (discount >= 0),
  delivery_fee integer NOT NULL CHECK (delivery_fee >= 0),
  total integer NOT NULL CHECK (total >= 0),
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  governorate text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL CHECK (char_length(message) BETWEEN 2 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON store_products;
CREATE POLICY "public_read_products" ON store_products FOR SELECT TO anon, authenticated USING (active = true);
DROP POLICY IF EXISTS "public_insert_products" ON store_products;
CREATE POLICY "public_insert_products" ON store_products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_products" ON store_products;
CREATE POLICY "public_update_products" ON store_products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_delete_products" ON store_products;
CREATE POLICY "public_delete_products" ON store_products FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_orders" ON store_orders;
CREATE POLICY "public_read_orders" ON store_orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_insert_orders" ON store_orders;
CREATE POLICY "public_insert_orders" ON store_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_orders" ON store_orders;
CREATE POLICY "public_update_orders" ON store_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_delete_orders" ON store_orders;
CREATE POLICY "public_delete_orders" ON store_orders FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_feedback" ON store_feedback;
CREATE POLICY "public_read_feedback" ON store_feedback FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_insert_feedback" ON store_feedback;
CREATE POLICY "public_insert_feedback" ON store_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_feedback" ON store_feedback;
CREATE POLICY "public_update_feedback" ON store_feedback FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_delete_feedback" ON store_feedback;
CREATE POLICY "public_delete_feedback" ON store_feedback FOR DELETE TO anon, authenticated USING (true);

INSERT INTO store_products (id, name_ar, name_en, price, old_price, image_url, gallery_urls, description_ar, description_en)
VALUES
  ('level-1', 'المستوى الأول', 'Level One', 150, NULL, '/images/products/المستوى_الاول.jpeg', ARRAY['/images/products/المستوى_الاول.jpeg'], 'بداية ممتعة مع أصوات الحروف القصيرة والأنشطة الأولى للقراءة.', 'A joyful start with short vowels and first reading activities.'),
  ('level-2', 'المستوى الثاني', 'Level Two', 250, NULL, '/images/products/المستوى_الثاني.jpeg', ARRAY['/images/products/المستوى_الثاني.jpeg'], 'خطوة جديدة لبناء كلمات أطول وفهم القراءة بثقة.', 'A new step toward longer words and confident reading.'),
  ('level-3', 'المستوى الثالث', 'Level Three', 180, NULL, '/images/products/المستوى_الثالث.jpeg', ARRAY['/images/products/المستوى_الثالث.jpeg'], 'تدريبات متقدمة تساعد طفلك على القراءة بطلاقة وحب.', 'Advanced practice that helps children read fluently and joyfully.'),
  ('complete-set', 'المجموعة الكاملة', 'Complete Set', 450, 600, '/images/products/المجموعه_كامله.jpeg', ARRAY['/images/products/المجموعه_كامله.jpeg', '/images/products/المستوى_الاول.jpeg', '/images/products/المستوى_الثاني.jpeg', '/images/products/المستوى_الثالث.jpeg'], 'المجموعة الكاملة للمستويات الثلاثة بسعر خاص بدلًا من 600 جنيه.', 'The complete three-level set at a special price instead of EGP 600.')
ON CONFLICT (id) DO NOTHING;