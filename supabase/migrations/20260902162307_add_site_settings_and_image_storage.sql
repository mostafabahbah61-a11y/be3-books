/*
# Add site settings table and product images storage

1. New Tables
- `store_settings` — single-row table holding editable site-wide content: site name (ar/en), hero subtitle (ar/en), WhatsApp number, Facebook URL, Instagram URL, footer text (ar/en).
2. New Storage Bucket
- `product-images` — public bucket for product cover and gallery images uploaded from the admin dashboard.
3. Security
- RLS enabled on `store_settings`; anon + authenticated can read and update (single-store model, admin gate is app-level).
- Storage policies allow anon + authenticated to read, upload, and delete objects in `product-images`.
4. Important notes
- Settings row seeded with id=1 only if missing; future edits preserved.
- Bucket created only if it doesn't already exist.
*/

CREATE TABLE IF NOT EXISTS store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name_ar text NOT NULL DEFAULT 'قارئي الصغير',
  site_name_en text NOT NULL DEFAULT 'My Little Reader',
  hero_subtitle_ar text NOT NULL DEFAULT 'رحلة طفلك نحو القراءة تبدأ من هنا — كتب مصممة بحب لكل مستوى',
  hero_subtitle_en text NOT NULL DEFAULT 'Your child''s reading journey starts here — books crafted with love for every level',
  whatsapp_number text NOT NULL DEFAULT '201156617653',
  facebook_url text NOT NULL DEFAULT 'https://www.facebook.com/MyLittleReaders/',
  instagram_url text NOT NULL DEFAULT '',
  footer_text_ar text NOT NULL DEFAULT 'كتب تعليمية للأطفال',
  footer_text_en text NOT NULL DEFAULT 'Educational books for children'
);

INSERT INTO store_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON store_settings;
CREATE POLICY "public_read_settings" ON store_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_update_settings" ON store_settings;
CREATE POLICY "public_update_settings" ON store_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_upload_product_images" ON storage.objects;
CREATE POLICY "public_upload_product_images" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_delete_product_images" ON storage.objects;
CREATE POLICY "public_delete_product_images" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'product-images');