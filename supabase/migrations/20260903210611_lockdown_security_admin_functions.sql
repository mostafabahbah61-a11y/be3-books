-- Lock down all tables: public can only read active products, insert orders, insert feedback
-- All admin operations go through SECURITY DEFINER functions that verify the admin password

-- ===== Public settings view (excludes admin_password) =====
DROP VIEW IF EXISTS public_settings_view;
CREATE VIEW public_settings_view AS
SELECT
  id, site_name_ar, site_name_en, hero_subtitle_ar, hero_subtitle_en,
  whatsapp_number, facebook_url, instagram_url, footer_text_ar, footer_text_en
FROM store_settings;

ALTER VIEW public_settings_view OWNER TO postgres;
REVOKE ALL ON public_settings_view FROM anon, authenticated;
GRANT SELECT ON public_settings_view TO anon, authenticated;

-- ===== Lock down store_settings: no direct anon access =====
DROP POLICY IF EXISTS "public_read_settings" ON store_settings;
DROP POLICY IF EXISTS "public_update_settings" ON store_settings;
-- No policies for anon on store_settings = fully locked

-- ===== Lock down store_products: public can only SELECT active =====
DROP POLICY IF EXISTS "public_read_products" ON store_products;
DROP POLICY IF EXISTS "public_insert_products" ON store_products;
DROP POLICY IF EXISTS "public_update_products" ON store_products;
DROP POLICY IF EXISTS "public_delete_products" ON store_products;

CREATE POLICY "public_read_active_products" ON store_products FOR SELECT
  TO anon, authenticated USING (active = true);
-- No INSERT/UPDATE/DELETE for anon

-- ===== Lock down store_orders: public can INSERT only, no SELECT/UPDATE/DELETE =====
DROP POLICY IF EXISTS "public_read_orders" ON store_orders;
DROP POLICY IF EXISTS "public_insert_orders" ON store_orders;
DROP POLICY IF EXISTS "public_update_orders" ON store_orders;
DROP POLICY IF EXISTS "public_delete_orders" ON store_orders;

CREATE POLICY "public_insert_orders" ON store_orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
-- No SELECT/UPDATE/DELETE for anon

-- ===== Lock down store_feedback: public can INSERT only, no SELECT/UPDATE/DELETE =====
DROP POLICY IF EXISTS "public_read_feedback" ON store_feedback;
DROP POLICY IF EXISTS "public_insert_feedback" ON store_feedback;
DROP POLICY IF EXISTS "public_update_feedback" ON store_feedback;
DROP POLICY IF EXISTS "public_delete_feedback" ON store_feedback;

CREATE POLICY "public_insert_feedback" ON store_feedback FOR INSERT
  TO anon, authenticated WITH CHECK (true);
-- No SELECT/UPDATE/DELETE for anon

-- ===== Lock down store_discount_settings: no anon access =====
DROP POLICY IF EXISTS "select_discount_settings" ON store_discount_settings;
DROP POLICY IF EXISTS "insert_discount_settings" ON store_discount_settings;
DROP POLICY IF EXISTS "update_discount_settings" ON store_discount_settings;
DROP POLICY IF EXISTS "delete_discount_settings" ON store_discount_settings;
-- No policies = fully locked for anon

-- ===== Lock down store_discount_rules: no anon access =====
DROP POLICY IF EXISTS "select_discount_rules" ON store_discount_rules;
DROP POLICY IF EXISTS "insert_discount_rules" ON store_discount_rules;
DROP POLICY IF EXISTS "update_discount_rules" ON store_discount_rules;
DROP POLICY IF EXISTS "delete_discount_rules" ON store_discount_rules;
-- No policies = fully locked for anon

-- ===== Revoke column-level UPDATE on store_products for anon =====
-- Already handled by not having UPDATE policies

-- ===== SECURITY DEFINER functions for admin operations =====
-- All verify the admin password server-side before performing any operation

CREATE OR REPLACE FUNCTION verify_admin_password(p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored text;
BEGIN
  SELECT admin_password INTO v_stored FROM store_settings WHERE id = 1;
  RETURN v_stored IS NOT NULL AND p_password = v_stored;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_admin_password FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_admin_password TO anon, authenticated;

-- Admin: get all products (including inactive)
CREATE OR REPLACE FUNCTION admin_get_products(p_password text)
RETURNS SETOF store_products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM store_products ORDER BY sort_order;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_get_products FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_products TO anon, authenticated;

-- Admin: get all orders
CREATE OR REPLACE FUNCTION admin_get_orders(p_password text)
RETURNS SETOF store_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM store_orders ORDER BY created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_get_orders FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_orders TO anon, authenticated;

-- Admin: delete order
CREATE OR REPLACE FUNCTION admin_delete_order(p_password text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM store_orders WHERE id = p_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_delete_order FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_delete_order TO anon, authenticated;

-- Admin: get all feedback
CREATE OR REPLACE FUNCTION admin_get_feedback(p_password text)
RETURNS SETOF store_feedback
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM store_feedback ORDER BY created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_get_feedback FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_feedback TO anon, authenticated;

-- Admin: delete feedback
CREATE OR REPLACE FUNCTION admin_delete_feedback(p_password text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM store_feedback WHERE id = p_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_delete_feedback FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_delete_feedback TO anon, authenticated;

-- Admin: save product (insert or update)
CREATE OR REPLACE FUNCTION admin_save_product(
  p_password text,
  p_id text,
  p_name_ar text,
  p_name_en text,
  p_price integer,
  p_old_price integer,
  p_image_url text,
  p_gallery_urls text[],
  p_description_ar text,
  p_description_en text,
  p_active boolean,
  p_sort_order integer,
  p_discount_enabled boolean,
  p_is_new boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_price IS NULL OR p_price < 0 THEN
    RAISE EXCEPTION 'Invalid price';
  END IF;
  IF p_is_new THEN
    INSERT INTO store_products (id, name_ar, name_en, price, old_price, image_url, gallery_urls, description_ar, description_en, active, sort_order, discount_enabled)
    VALUES (p_id, p_name_ar, p_name_en, p_price, p_old_price, p_image_url, p_gallery_urls, p_description_ar, p_description_en, p_active, p_sort_order, p_discount_enabled);
  ELSE
    UPDATE store_products SET
      name_ar = p_name_ar, name_en = p_name_en, price = p_price, old_price = p_old_price,
      image_url = p_image_url, gallery_urls = p_gallery_urls, description_ar = p_description_ar,
      description_en = p_description_en, active = p_active, sort_order = p_sort_order,
      discount_enabled = p_discount_enabled, updated_at = now()
    WHERE id = p_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_save_product FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_save_product TO anon, authenticated;

-- Admin: delete product
CREATE OR REPLACE FUNCTION admin_delete_product(p_password text, p_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM store_products WHERE id = p_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_delete_product FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_delete_product TO anon, authenticated;

-- Admin: update settings
CREATE OR REPLACE FUNCTION admin_update_settings(
  p_password text,
  p_site_name_ar text,
  p_site_name_en text,
  p_hero_subtitle_ar text,
  p_hero_subtitle_en text,
  p_whatsapp_number text,
  p_facebook_url text,
  p_instagram_url text,
  p_footer_text_ar text,
  p_footer_text_en text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE store_settings SET
    site_name_ar = p_site_name_ar, site_name_en = p_site_name_en,
    hero_subtitle_ar = p_hero_subtitle_ar, hero_subtitle_en = p_hero_subtitle_en,
    whatsapp_number = p_whatsapp_number, facebook_url = p_facebook_url,
    instagram_url = p_instagram_url, footer_text_ar = p_footer_text_ar,
    footer_text_en = p_footer_text_en
  WHERE id = 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_update_settings FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_settings TO anon, authenticated;

-- Admin: change admin password
CREATE OR REPLACE FUNCTION admin_change_password(
  p_password text,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF char_length(p_new_password) < 3 THEN
    RAISE EXCEPTION 'Password too short';
  END IF;
  UPDATE store_settings SET admin_password = p_new_password WHERE id = 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_change_password FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_change_password TO anon, authenticated;

-- Admin: get discount settings
CREATE OR REPLACE FUNCTION admin_get_discount_settings(p_password text)
RETURNS SETOF store_discount_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM store_discount_settings;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_get_discount_settings FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_discount_settings TO anon, authenticated;

-- Admin: update discount settings
CREATE OR REPLACE FUNCTION admin_update_discount_settings(
  p_password text,
  p_min_quantity integer,
  p_discount_per_book integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_min_quantity IS NULL OR p_min_quantity < 2 THEN
    RAISE EXCEPTION 'Invalid min quantity';
  END IF;
  IF p_discount_per_book IS NULL OR p_discount_per_book < 1 THEN
    RAISE EXCEPTION 'Invalid discount per book';
  END IF;
  UPDATE store_discount_settings SET
    min_quantity = p_min_quantity,
    discount_per_book = p_discount_per_book
  WHERE id = 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_update_discount_settings FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_discount_settings TO anon, authenticated;

-- Admin: toggle product discount
CREATE OR REPLACE FUNCTION admin_toggle_product_discount(
  p_password text,
  p_product_id text,
  p_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE store_products SET discount_enabled = p_enabled WHERE id = p_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_toggle_product_discount FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_toggle_product_discount TO anon, authenticated;

-- Admin: toggle all products discount
CREATE OR REPLACE FUNCTION admin_toggle_all_products_discount(
  p_password text,
  p_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE store_products SET discount_enabled = p_enabled;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_toggle_all_products_discount FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_toggle_all_products_discount TO anon, authenticated;