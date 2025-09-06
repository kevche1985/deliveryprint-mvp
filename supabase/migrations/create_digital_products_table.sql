-- Create digital_products table to store AI-generated product information
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('logo', 'image', 'font')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  formats JSONB DEFAULT '["png", "jpg", "svg"]'::jsonb,
  generation_params JSONB,
  is_purchased BOOLEAN DEFAULT false,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for digital_products
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can insert their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can update their own digital products" ON digital_products;

-- Users can view their own digital products
CREATE POLICY "Users can view their own digital products"
  ON digital_products
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own digital products
CREATE POLICY "Users can insert their own digital products"
  ON digital_products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own digital products
CREATE POLICY "Users can update their own digital products"
  ON digital_products
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_digital_products_updated_at ON digital_products;

-- Create trigger to update updated_at on digital_products
CREATE TRIGGER update_digital_products_updated_at
BEFORE UPDATE ON digital_products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create storage bucket for digital products if it doesn't exist
-- Note: This requires superuser privileges and might need to be done manually
-- or through the Supabase dashboard
