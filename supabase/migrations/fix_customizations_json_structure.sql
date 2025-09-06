-- Ensure customizations JSON has proper structure for storing image URLs
-- Update existing records to include customizedProductImage in customizations

UPDATE order_items 
SET customizations = jsonb_set(
    COALESCE(customizations, '{}'::jsonb),
    '{customizedProductImage}',
    to_jsonb(design_image_url)
)
WHERE design_image_url IS NOT NULL 
AND (customizations IS NULL OR customizations->>'customizedProductImage' IS NULL);

-- Add a function to extract the display image URL from order items
CREATE OR REPLACE FUNCTION get_order_item_display_image(order_item_row order_items)
RETURNS TEXT AS $$
BEGIN
    -- Priority: customized_product_image_url > customizations.customizedProductImage > design_image_url > product_image_url
    RETURN COALESCE(
        order_item_row.customized_product_image_url,
        order_item_row.customizations->>'customizedProductImage',
        order_item_row.design_image_url,
        order_item_row.product_image_url
    );
END;
$$ LANGUAGE plpgsql;
