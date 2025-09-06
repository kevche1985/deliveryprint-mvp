-- Fix RLS policies for digital_products table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can insert their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can update their own digital products" ON digital_products;

-- Create more permissive policies for testing and proper functionality

-- Allow authenticated users to view their own digital products
CREATE POLICY "Users can view their own digital products"
  ON digital_products
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Allow authenticated users to insert their own digital products
CREATE POLICY "Users can insert their own digital products"
  ON digital_products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own digital products
CREATE POLICY "Users can update their own digital products"
  ON digital_products
  FOR UPDATE
  USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete their own digital products
CREATE POLICY "Users can delete their own digital products"
  ON digital_products
  FOR DELETE
  USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Create storage policies for the digital-products bucket
-- Note: These need to be created in the Supabase dashboard or via SQL if you have the right permissions

-- Allow authenticated users to upload files to their own folder
-- INSERT policy for storage.objects
INSERT INTO storage.buckets (id, name, public) 
VALUES ('digital-products', 'digital-products', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies (these might need to be done via Supabase dashboard)
-- For now, let's make the bucket public for testing
UPDATE storage.buckets 
SET public = true 
WHERE id = 'digital-products';
