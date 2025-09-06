-- Add digital_product_id column to order_items table
-- This links order items to digital products for proper image display

-- Add the column if it doesn't exist
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS digital_product_id UUID REFERENCES digital_products(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_digital_product_id ON order_items(digital_product_id);

-- Add the missing columns that were referenced in the OrderItem type
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS customized_image_url TEXT,
ADD COLUMN IF NOT EXISTS print_ready_file_url TEXT;

-- Update RLS policies to allow access to digital product joins
-- This ensures the join query in the order details page works properly

-- Allow users to view order items with digital product joins
DROP POLICY IF EXISTS "Users can view their order items with digital products" ON order_items;
CREATE POLICY "Users can view their order items with digital products" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Allow admins to view all order items with digital products
DROP POLICY IF EXISTS "Admins can view all order items with digital products" ON order_items;
CREATE POLICY "Admins can view all order items with digital products" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'operator')
    )
  );

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name IN ('digital_product_id', 'customized_image_url', 'print_ready_file_url')
ORDER BY column_name;