/*
# Add admin password to store settings

1. Modified Tables
- `store_settings` — add `admin_password` text column (default 'admin') so the site owner can change the dashboard password from the admin panel.
2. Security
- No policy changes needed; existing update policy on store_settings covers the new column.
3. Important notes
- Column added only if it doesn't already exist (idempotent via DO block).
- Default value 'admin' preserves current behavior until the owner changes it.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'admin_password'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN admin_password text NOT NULL DEFAULT 'admin';
  END IF;
END $$;