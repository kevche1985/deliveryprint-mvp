-- First, let's check if we need to update the shipping_method enum
-- Drop the existing constraint if it exists
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_shipping_method_check;

-- Add the shipping_method column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_method TEXT;

-- Add a check constraint for valid shipping methods
ALTER TABLE orders 
ADD CONSTRAINT orders_shipping_method_check 
CHECK (shipping_method IN ('standard', 'express', 'overnight', 'pickup'));

-- Add other missing columns if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Update any existing 'regular' values to 'standard'
UPDATE orders 
SET shipping_method = 'standard' 
WHERE shipping_method = 'regular';
