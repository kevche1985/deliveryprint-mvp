-- Add 'download' to the shipping_method_enum
ALTER TYPE shipping_method_enum ADD VALUE IF NOT EXISTS 'download';

-- Update any existing orders that might need this
-- (This is just for safety, shouldn't be needed for new installations)
