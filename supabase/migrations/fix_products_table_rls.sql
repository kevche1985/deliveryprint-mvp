-- Fix RLS policies for products table to allow public access

-- Check if RLS is enabled on products table
-- If enabled without policies, it blocks all access

-- Disable RLS temporarily to allow public access to products
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Alternative: Enable RLS with public read policy
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Anyone can view active products" ON products
--     FOR SELECT USING (is_active = true);

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
Where table_name = 'products' 
ORDER BY ordinal_position;

-- Test query to verify products are accessible
SELECT id, name, price, is_active, is_featured 
FROM products 
WHERE is_active = true
ORDER BY created_at DESC;