ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variant_dimensions JSONB DEFAULT '[]'::jsonb;

UPDATE products
  SET variant_dimensions = '[]'::jsonb
  WHERE variant_dimensions IS NULL;
