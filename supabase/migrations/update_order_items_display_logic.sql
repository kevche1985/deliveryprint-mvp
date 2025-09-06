-- Create a view that prioritizes customized product image over base product image
CREATE OR REPLACE VIEW order_items_with_images AS
SELECT 
    oi.*,
    COALESCE(
        oi.customized_product_image_url,
        oi.design_image_url,
        oi.product_image_url
    ) as display_image_url,
    CASE 
        WHEN oi.customized_product_image_url IS NOT NULL THEN 'customized'
        WHEN oi.design_image_url IS NOT NULL THEN 'design'
        ELSE 'product'
    END as image_type
FROM order_items oi;

-- Grant access to the view
GRANT SELECT ON order_items_with_images TO authenticated;
GRANT SELECT ON order_items_with_images TO anon;
