-- Add image columns to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS design_image_url TEXT,
ADD COLUMN IF NOT EXISTS product_image_url TEXT,
ADD COLUMN IF NOT EXISTS print_ready_file_url TEXT,
ADD COLUMN IF NOT EXISTS design_specifications JSONB DEFAULT '{}';

-- Add image tracking to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS has_design_files BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS production_notes TEXT,
ADD COLUMN IF NOT EXISTS operator_downloads JSONB DEFAULT '[]';

-- Create order_files table for better file management
CREATE TABLE IF NOT EXISTS order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL, -- 'design', 'product_image', 'print_ready', 'proof'
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID,
  is_print_ready BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view their order files" ON order_files;
DROP POLICY IF EXISTS "Admins can manage all order files" ON order_files;

-- Add RLS policies for order_files
ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order files" ON order_files
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all order files" ON order_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_order_files_order_id ON order_files(order_id);
CREATE INDEX IF NOT EXISTS idx_order_files_type ON order_files(file_type);
CREATE INDEX IF NOT EXISTS idx_order_items_design_id ON order_items(design_id);

-- Update existing order_items to mark which ones have designs
UPDATE order_items 
SET design_image_url = '/placeholder.svg?height=200&width=200'
WHERE design_id IS NOT NULL AND design_image_url IS NULL;

-- Update orders to mark which ones have design files
UPDATE orders 
SET has_design_files = true 
WHERE id IN (
  SELECT DISTINCT order_id 
  FROM order_items 
  WHERE design_id IS NOT NULL
) AND has_design_files IS NULL;
