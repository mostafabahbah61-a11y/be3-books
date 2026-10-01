DROP VIEW IF EXISTS public_discount_settings_view;
CREATE VIEW public_discount_settings_view AS
SELECT id, min_quantity, discount_per_book
FROM store_discount_settings;

ALTER VIEW public_discount_settings_view OWNER TO postgres;
REVOKE ALL ON public_discount_settings_view FROM anon, authenticated;
GRANT SELECT ON public_discount_settings_view TO anon, authenticated;