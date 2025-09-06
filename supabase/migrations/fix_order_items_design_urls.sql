-- This migration ensures the order_items table has columns for design and customized product images.
-- It also adds a function to get the best image URL for display.

-- Add customized_product_image_url to order_items if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'customized_product_image_url') THEN
        ALTER TABLE order_items ADD COLUMN customized_product_image_url TEXT;
    END IF;
END $$;

-- Add design_file_url to order_items if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'design_file_url') THEN
        ALTER TABLE order_items ADD COLUMN design_file_url TEXT;
    END IF;
END $$;

-- Add design_image_url to order_items if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'design_image_url') THEN
        ALTER TABLE order_items ADD COLUMN design_image_url TEXT;
    END IF;
END $$;

-- Create or replace a function to get the best display image for an order item
CREATE OR REPLACE FUNCTION get_order_item_display_image(item_row order_items)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- Prioritize customized_product_image_url, then design_image_url, then product_image_url
    IF item_row.customized_product_image_url IS NOT NULL THEN
        RETURN item_row.customized_product_image_url;
    ELSIF item_row.design_image_url IS NOT NULL THEN
        RETURN item_row.design_image_url;
    ELSIF item_row.product_image_url IS NOT NULL THEN
        RETURN item_row.product_image_url;
    ELSE
        RETURN '/placeholder.svg'; -- Fallback placeholder
    END IF;
END;
$$;

-- Update existing order_items to populate customized_product_image_url from customizations if available
UPDATE order_items
SET customized_product_image_url = (customizations->>'customizedProductImage')
WHERE customized_product_image_url IS NULL
  AND customizations IS NOT NULL
  AND customizations->>'customizedProductImage' IS NOT NULL;

-- Update existing order_items to populate design_file_url from customizations if available
UPDATE order_items
SET design_file_url = (customizations->>'designUrl')
WHERE design_file_url IS NULL
  AND customizations IS NOT NULL
  AND customizations->>'designUrl' IS NOT NULL;

-- Update existing order_items to populate design_image_url from customizations if available
UPDATE order_items
SET design_image_url = (customizations->>'preview_url')
WHERE design_image_url IS NULL
  AND customizations IS NOT NULL
  AND customizations->>'preview_url' IS NOT NULL;
</merged_code>
